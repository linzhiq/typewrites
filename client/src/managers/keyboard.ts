import { arrayUnion, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect } from "react";
import { CursorManagerMethods, userCursorPosition } from "./cursors";

export const useKeyboardManager: (
  cursorManagerMethods: CursorManagerMethods
) => void = ({setUserCursorPosition}) => {
  const onKeyboardEvent = async (e: KeyboardEvent) => {
    const previousCursorPosition = {...userCursorPosition}
    setUserCursorPosition({
      ...userCursorPosition,
      column: userCursorPosition.column + 1
    });

    await updateDoc(doc(db, "docs", "0", "lines", `${userCursorPosition.line}`), {
      [`character_${previousCursorPosition.column}`]: arrayUnion(e.key),
      modificationDate: serverTimestamp()
    });
  };

  useEffect(() => {
    window.addEventListener("keydown", onKeyboardEvent);
    return () => {
      window.removeEventListener("keydown", onKeyboardEvent);
    };
  });
};
