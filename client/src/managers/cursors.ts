import React, { useEffect } from "react";
import {
  addDoc,
  onSnapshot,
  collection,
  query,
  serverTimestamp,
  where,
  DocumentReference,
  Unsubscribe,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { PlayerData } from "../types";
import { setInterval } from "timers";

/* Constants */
const PLAYER_CURSOR_ALIVE_TIMEOUT = 30 * 1000; // 30 seconds
const USER_CURSOR_HEARTBEAT_INTERVAL = 20 * 1000; // 20 seconds

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

export type SetUserCursorPosition = (position: CursorPosition) => void;

/* States
  TODO(lqi): avoid singletons
* */
let userPlayerReference: DocumentReference | null = null;
let userPlayerUpdatePendingPromise: Promise<DocumentReference | void> | null =
  null;
export let userCursorPosition: CursorPosition;

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
const playerCursorColorIdById: Map<PlayerId, number> = new Map<
  PlayerId,
  number
>();
const playerDeathTimeoutTimeoutIdFromPlayerId: Map<string, number> = new Map<
  string,
  number
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

  // set the content if dispatch is registered after cursor data load
  dispatchSetCursorsForPosition(serializePosition(position));
};

export const unregisterSetCursorsDispatch = (position: CursorPosition) => {
  dispatchAtPosition.delete(serializePosition(position));
};

const dispatchSetCursorsForPosition = (position: CursorPositionSerialized) => {
  dispatchAtPosition.get(position)?.({
    players: playerIdsAtPosition.get(position),
    self:
      userCursorPosition && serializePosition(userCursorPosition) === position,
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

    playerDeathTimeoutTimeoutIdFromPlayerId.set(
      id,
      setTimeout(() => {
        removePlayer(id);
      }, player.lastAlive.toMillis() + PLAYER_CURSOR_ALIVE_TIMEOUT - Date.now()) as unknown as number
    ); // does not handle Node-style timeout
  }
};

const removePlayer = (id: string) => {
  const timeoutId = playerDeathTimeoutTimeoutIdFromPlayerId.get(id);
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  const prevPosition = serializePositionFromPlayer(playerDataById.get(id));
  if (prevPosition) {
    playerIdsAtPosition.get(prevPosition)?.delete(id);
    dispatchSetCursorsForPosition(prevPosition);
  }
};

export const cursorColorIdForPlayerId = (playerId: string): number => {
  let colorId = playerCursorColorIdById.get(playerId);
  if (!colorId) {
    colorId = playerCursorColorIdById.size + 1;
    playerCursorColorIdById.set(playerId, colorId);
  }

  return colorId;
};

/* Firestore subscriptions on cursors  */
let playerSubscriptionUnsubscribe: Unsubscribe;

const setUpSubscription = () => {
  if (playerSubscriptionUnsubscribe) {
    playerSubscriptionUnsubscribe();
  }

  playerSubscriptionUnsubscribe = onSnapshot(
    query(
      collection(db, "docs", "0", "players"),
      where("exitedGracefully", "==", false),
      where(
        "lastAlive",
        ">=",
        Timestamp.fromMillis(Date.now() - PLAYER_CURSOR_ALIVE_TIMEOUT)
      )
    ),
    (snapshot) => {
      const removedPlayerIds = new Set(playerDataById.keys());

      for (const doc of snapshot.docs) {
        const player: PlayerData = doc.data() as any;
        if (doc.id === userPlayerReference?.id) {
          // ignore updates on user cursor
          continue;
        }

        onPlayerDataUpdate(doc.id, player);
        removedPlayerIds.delete(doc.id);
      }

      for (const playerId of removedPlayerIds) {
        removePlayer(playerId);
      }
    }
  );
};

/* User cursor */
let userCursorHeartbeatIntervalId: any;

export const setUserCursorPosition: SetUserCursorPosition = (position) => {
  const previousUserPosition = { ...userCursorPosition };
  userCursorPosition = position;

  previousUserPosition &&
    dispatchSetCursorsForPosition(serializePosition(previousUserPosition));
  dispatchSetCursorsForPosition(serializePosition(userCursorPosition));

  // send new userCursorPosition to remote
  userCursorPositionUpdateRemote();
};

const userCursorPositionUpdateRemote = () => {
  if (userPlayerUpdatePendingPromise || !userCursorPosition) {
    // skip update
    return;
  }

  const newUserPosition = { ...userCursorPosition };
  const data = {
    lastAlive: serverTimestamp(),
    exitedGracefully: false,
    cursorLine: newUserPosition.line,
    cursorColumn: newUserPosition.column,
  };

  userPlayerUpdatePendingPromise = userPlayerReference
    ? updateDoc(userPlayerReference, data)
    : addDoc(collection(db, "docs", "0", "players"), data);

  userPlayerUpdatePendingPromise
    .then((reference) => {
      userPlayerUpdatePendingPromise = null;

      if (reference) {
        userPlayerReference = reference;
      }

      if (
        serializePosition(userCursorPosition) !==
        serializePosition(newUserPosition)
      ) {
        // cursor position has updated since document write
        userCursorPositionUpdateRemote();
      }
    })
    .catch(() => {
      userPlayerUpdatePendingPromise = null;
    });
};

const userCursorPositionGracefulExit = async () => {
  // Depending on the browser, this may or may not be called
  userPlayerReference &&
    (await updateDoc(userPlayerReference, {
      exitedGracefully: true,
    }));
};

/* Hook */
export type CursorManagerMethods = {
  setUserCursorPosition: SetUserCursorPosition;
};

const beforeUnloadEventHandler = async (e: BeforeUnloadEvent) => {
  await userCursorPositionGracefulExit();
};

export const useCursorManager: () => CursorManagerMethods = () => {
  useEffect(() => {
    // Subscription of other players
    setUpSubscription();

    // Heartbeat of user player
    userCursorHeartbeatIntervalId = setInterval(
      userCursorPositionUpdateRemote,
      USER_CURSOR_HEARTBEAT_INTERVAL
    );
    window.addEventListener("beforeunload", beforeUnloadEventHandler);

    return () => {
      userCursorPositionGracefulExit().then();

      playerSubscriptionUnsubscribe && playerSubscriptionUnsubscribe();

      userCursorHeartbeatIntervalId &&
        clearInterval(userCursorHeartbeatIntervalId);
      window.removeEventListener("beforeunload", beforeUnloadEventHandler);
    };
  });

  return { setUserCursorPosition };
};
