import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import { db } from "../firebase";
import { CursorsForCell, registerSetCursorDispatch } from "../cursors";

// use string instead of array to allow shallow compare with React.memo
type CharacterContent = string;

type CharacterProps = {
  lineIdx: number;
  columnIdx: number;
  content: CharacterContent;
};

const Character = React.memo<CharacterProps>(({ content, lineIdx, columnIdx }) => {
  const [cursor, setCursor] = useState<CursorsForCell>(null);
  
  useEffect(() => {
    registerSetCursorDispatch(setCursor, lineIdx, columnIdx);
  }, []);

  return (
    <div
      key={`${columnIdx}`}
      className="character"
      style={{ borderRight: (cursor && "1px solid black") || undefined }}
      onClick={() => {
        // setCursor(!cursor);
      }}
    >
      {[...content].map((char, idx) => {
        return (
          <div
            className="revision"
            style={{ opacity: 1 - (content.length - 1 - idx) / 5 }}
          >
            {char}
          </div>
        );
      })}
    </div>
  );
});

type LineProps = {
  docId: string;
  lineIdx: number;
};

const CHAR_PER_LINE = 80;

export const Line: React.FC<LineProps> = ({ docId, lineIdx }) => {
  const [characterContent, setCharacterContent] = useState<CharacterContent[]>(
    [...Array(CHAR_PER_LINE).keys()].map(() => "")
  );

  useEffect(
    () =>
      onSnapshot(doc(db, "docs", docId, "lines", `${lineIdx}`), (line) => {
        const data = line.data();
        if (!data) {
          return;
        }

        setCharacterContent((prevCharacterContent) =>
          prevCharacterContent.map(
            (value, idx) => data[`character_${idx}`]?.join("") || ""
          )
        );
      }),
    []
  );

  return (
    <div className="line">
      {characterContent.map((content, idx) => (
        <Character lineIdx={lineIdx} columnIdx={idx} content={content} />
      ))}
    </div>
  );
};
