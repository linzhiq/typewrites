import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useEffect } from "react";

let column = 3;

const onKeyboardEvent = async (e: KeyboardEvent) => {
  await updateDoc(doc(db, "docs", "0", "lines", `0`), {
    [`character_${column++}`]: arrayUnion(e.key)
  });
}

export const useKeyboardMonitor = () => {
  return useEffect(() => {
    window.addEventListener("keydown", onKeyboardEvent);
    return () => {
      window.removeEventListener("keydown", onKeyboardEvent);
    }
  }, []);
}