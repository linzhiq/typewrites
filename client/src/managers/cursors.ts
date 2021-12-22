import React, { useEffect, useState } from "react";
import {
  onSnapshot,
  collection,
  query,
  where,
  Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { PlayerData } from "../types";

/* Types */
type PlayerId = string; // doc.players.__name__
export type CursorsForCell = {
  self: boolean;
  players?: Set<PlayerId>;
};

export type CursorPosition = {
  line: number;
  column: number;
};
type CursorPositionSerialized = `${number},${number}`;
type SetCursorsDispatch = React.Dispatch<React.SetStateAction<CursorsForCell>>;

/* States */
let userId: PlayerId;
export let userCursorPosition: CursorPosition; // TODO(lqi): make this singleton stateful

const playerIdsAtPosition: Map<
  CursorPositionSerialized,
  Set<PlayerId>
> = new Map<CursorPositionSerialized, Set<PlayerId>>();
const dispatchAtPosition: Map<CursorPositionSerialized, SetCursorsDispatch> =
  new Map<CursorPositionSerialized, SetCursorsDispatch>();
const playerDataById: Map<PlayerId, PlayerData> = new Map<
  PlayerId,
  PlayerData
>();

/* Position helpers */
const serializePosition = ({
  line,
  column,
}: CursorPosition): CursorPositionSerialized => `${line},${column}`;

const serializePositionFromPlayer = (
  player: PlayerData | undefined
): CursorPositionSerialized | undefined =>
  player
    ? serializePosition({
        line: player.cursorLine,
        column: player.cursorColumn,
      })
    : undefined;

/* Dispatch helpers */
export const registerSetCursorsDispatch = (
  dispatch: SetCursorsDispatch,
  position: CursorPosition
) => {
  dispatchAtPosition.set(serializePosition(position), dispatch);
};

export const unregisterSetCursorsDispatch = (position: CursorPosition) => {
  dispatchAtPosition.delete(serializePosition(position));
};

const dispatchSetCursorsForPosition = (position: CursorPositionSerialized) => {
  dispatchAtPosition.get(position)?.({
    players: playerIdsAtPosition.get(position),
    self: serializePosition(userCursorPosition) === position,
  });
};

/* Player helpers */
const onPlayerDataUpdate = (id: string, player: PlayerData) => {
  // remove previous position of player
  removePlayer(id);

  // update with new position
  const newPosition = serializePositionFromPlayer(player);
  if (newPosition) {
    playerDataById.set(id, player);
    playerIdsAtPosition.set(
      newPosition,
      (playerIdsAtPosition.get(newPosition) || new Set()).add(id)
    );
    dispatchSetCursorsForPosition(newPosition);
  }
};

const removePlayer = (id: string) => {
  const prevPosition = serializePositionFromPlayer(playerDataById.get(id));
  if (prevPosition) {
    playerIdsAtPosition.get(prevPosition)?.delete(id);
    dispatchSetCursorsForPosition(prevPosition);
  }
};

/* Firestore subscriptions on cursors  */
const CURSOR_ALIVE_TIMEOUT = 60 * 60 * 1000; // 1 hour
const CURSOR_RESUBSCRIBE_INTERVAL = 0.5 * 60 * 1000; // 30 seconds

let unsubscribe: Unsubscribe;
let intervalId: any;

const setUpSubscription = () => {
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
        const removedPlayerIds = new Set(playerDataById.keys());

        for (const doc of snapshot.docs) {
          const player: PlayerData = doc.data() as any;

          onPlayerDataUpdate(doc.id, player);
          removedPlayerIds.delete(doc.id);
        }

        for (const playerId of removedPlayerIds) {
          removePlayer(playerId);
        }
      }
    );
  };

  updateSubscription();
  intervalId = setInterval(updateSubscription, CURSOR_RESUBSCRIBE_INTERVAL);
};

/* User cursor */
export type SetUserCursorPosition = (position: CursorPosition) => void;

export const setUserCursorPosition: SetUserCursorPosition = (position) => {
  const previousUserPosition = {...userCursorPosition};
  userCursorPosition = position;

  previousUserPosition &&
    dispatchSetCursorsForPosition(serializePosition(previousUserPosition));
  dispatchSetCursorsForPosition(serializePosition(userCursorPosition));
};

/* Hook */
export type CursorManagerMethods = {
  setUserCursorPosition: SetUserCursorPosition;
};

export const useCursorManager: () => CursorManagerMethods = () => {
  useEffect(() => {
    setUpSubscription();
    return () => {
      intervalId && clearInterval(intervalId);
      unsubscribe && unsubscribe();
    };
  });

  return { setUserCursorPosition };
};
