import React, { useEffect, useState } from "react";
import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  serverTimestamp,
  Unsubscribe,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { setUserCursorPosition, userCursorPosition } from "./cursors";

/* States */
const dispatchAtLine: Map<number, SetLineContentDispatch> = new Map<
  number,
  SetLineContentDispatch
>();
export const contentAtLine: Map<number, LineContent> = new Map<
  number,
  LineContent
>();

export let lineCount: number;
let setLineCount: React.Dispatch<React.SetStateAction<number>>;

/* Dispatch helpers */
// use string instead of array to allow shallow comparison with React.memo
export type CharacterContent = string;
export type LineContent = CharacterContent[];

type SetLineContentDispatch = React.Dispatch<React.SetStateAction<LineContent>>;

const lineContentEquals = (
  content1: LineContent | undefined,
  content2: LineContent | undefined
): boolean => {
  if (!content1 || !content2 || content1.length !== content2.length) {
    return false;
  }

  for (let idx = 0; idx < content1.length; idx++) {
    if (content1[idx] !== content2[idx]) {
      return false;
    }
  }

  return true;
};

export const registerSetLineContentDispatch = (
  line: number,
  dispatch: SetLineContentDispatch
) => {
  dispatchAtLine.set(line, dispatch);

  // set the content if dispatch is registered after content load
  const prevContent = contentAtLine.get(line);
  if (prevContent) {
    dispatch(prevContent);
  }
};

export const unregisterSetLineContentDispatch = (line: number) => {
  dispatchAtLine.delete(line);
};

/* Line helpers */
const onLineContentUpdate = (line: number, lineContent: LineContent) => {
  const prevContent = contentAtLine.get(line);
  const dispatch = dispatchAtLine.get(line);

  if (dispatch && !lineContentEquals(prevContent, lineContent)) {
    contentAtLine.set(line, lineContent);
    dispatch(lineContent);
  }
};

/* Public content helpers */
export const setCurrentCharacter = (char: string) => {
  updateDoc(doc(db, "docs", "0", "lines", `${userCursorPosition.line}`), {
    [`character_${userCursorPosition.column}`]: arrayUnion(char[0]),
    modificationDate: serverTimestamp(),
  }).then();
};

export const addCurrentLine = () => {
  setDoc(doc(db, "docs", "0", "lines", `${userCursorPosition.line}`), {
    modificationDate: serverTimestamp(),
  }).then();
};

/* Firestore subscriptions on document */
export const CHAR_PER_LINE = 80;

let unsubscribe: Unsubscribe;

const setUpSubscription = () => {
  unsubscribe = onSnapshot(
    // TODO(lqi): pagination
    query(collection(db, "docs", "0", "lines")),
    (snapshot) => {
      // Render more lines as they are added
      const maxLine = snapshot.docs.reduce(
        (prev, doc) => Math.max(parseInt(doc.id)),
        0
      );
      maxLine >= lineCount && setLineCount(maxLine + 1);

      if (!userCursorPosition) {
        // Create a new line and place the cursor
        setUserCursorPosition({
          line: maxLine + 1,
          column: 0
        });
        addCurrentLine();
      }

      for (const doc of snapshot.docs) {
        onLineContentUpdate(
          parseInt(doc.id),
          [...Array(CHAR_PER_LINE).keys()].map((idx) => {
            return doc.data()[`character_${idx}`]?.join("") || "";
          })
        );
      }
    }
  );
};

/* Hook */

export const useDocument = () => {
  [lineCount, setLineCount] = useState<number>(0);

  useEffect(() => {
    setUpSubscription();
    return () => {
      unsubscribe && unsubscribe();
    };
  });

  return { lineCount };
};
