import React, { useEffect, useState } from "react";

import { Character } from "./Character";
import {
  CharacterContent,
  registerSetLineContentDispatch,
  unregisterSetLineContentDispatch,
} from "../managers/documents";

type LineProps = {
  lineIdx: number;
};

export const Line: React.FC<LineProps> = ({ lineIdx }) => {
  const [characterContent, setCharacterContent] = useState<CharacterContent[]>(
    []
  );

  useEffect(() => {
    registerSetLineContentDispatch(lineIdx, setCharacterContent);
    return () => {
      unregisterSetLineContentDispatch(lineIdx);
    };
  });

  return (
    <div className="line" key={`${lineIdx}`}>
      {characterContent.map((content, idx) => (
        <Character lineIdx={lineIdx} columnIdx={idx} content={content} />
      ))}
    </div>
  );
};
