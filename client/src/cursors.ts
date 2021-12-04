import React from "react";
import {
  onSnapshot,
  collection,
  query,
  where,
  Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Player } from "./types";

type PlayerId = string; // doc.players.__name__
export type CursorsForCell = PlayerId[] | null;

type CursorPosition = `${number},${number}`;
type SetCursorDispatch = React.Dispatch<React.SetStateAction<CursorsForCell>>;

// Manually keep track of cursor states and call dispatches on updates
let selfId: PlayerId;
const dispatchForPosition: Map<CursorPosition, SetCursorDispatch> = new Map<
  CursorPosition,
  SetCursorDispatch
>();
const playerById: Map<PlayerId, Player> = new Map<PlayerId, Player>();

function positionFromPlayer<T>(
  player: Player | undefined
): CursorPosition | undefined {
  return player ? `${player.cursorLine},${player.cursorColumn}` : undefined;
}

export const registerSetCursorDispatch = (
  dispatch: SetCursorDispatch,
  line: number,
  column: number
) => {
  dispatchForPosition.set(`${line},${column}`, dispatch);
};

export const unregisterSetCursorDispatch = (line: number, column: number) => {
  dispatchForPosition.delete(`${line},${column}`);
};

const updatePlayer = (id: string, player: Player) => {
  // remove cursor from previous position
  const prevPosition = positionFromPlayer(playerById.get(id));
  if (prevPosition) {
    const dispatch = dispatchForPosition.get(prevPosition);
    if (dispatch) {
      dispatch((prevState) => {
        if (prevState) {
          return prevState.filter((playerId) => playerId !== id);
        }

        return null;
      });
    }
  }

  // update with new position
  playerById.set(id, player);
  const dispatch = dispatchForPosition.get(positionFromPlayer(player)!);
  if (dispatch) {
    dispatch((prevState) =>
      // always show user cursor first; rank cursors for the same position by lastAlive
      [...(prevState || []), id].sort((id1, id2) => {
        const [player1, player2] = [playerById.get(id1), playerById.get(id2)];
    
        if (id1 === selfId || !player2) {
          return -1;
        }
        if (id2 === selfId || !player1) {
          return 1;
        }
    
        return player1.lastAlive.toMillis() - player2.lastAlive.toMillis();
      }));
  }
};

const removePlayer = (id: string) => {

}

const setupSubscription = () => {
  const CURSOR_ALIVE_TIMEOUT = 60 * 60 * 1000; // 1 hour
  const CURSOR_RESUBSCRIBE_INTERVAL = 1 * 60 * 1000; // 1 minute

  let unsubscribe: Unsubscribe;

  const updateSubscription = () => {
    if (unsubscribe) {
      unsubscribe();
    }

    unsubscribe = onSnapshot(
      query(
        collection(db, "docs", "0", "players"),
        where(
          "lastAlive",
          ">=",
          Timestamp.fromMillis(Date.now() - CURSOR_ALIVE_TIMEOUT)
        )
      ),
      (snapshot) => {
        const removedPlayerIds = new Set(playerById.keys());
        
        for (const doc of snapshot.docs) {
          const player: Player = doc.data() as any;
          
          updatePlayer(doc.id, player);
          removedPlayerIds.delete(doc.id);
        }
      }
    );
  };

  updateSubscription();
  setInterval(updateSubscription, CURSOR_RESUBSCRIBE_INTERVAL);
};

const setupReport = () => {};

setupSubscription();
setupReport();
