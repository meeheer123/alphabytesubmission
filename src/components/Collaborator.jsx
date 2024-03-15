import React, { useRef, useState } from 'react';
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";
import { executeCode } from '../api';

function Collaborator() {
  const editorRef = useRef(null);
  const [editorContent, setEditorContent] = useState("");

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    const doc = new Y.Doc();
    const provider = new WebrtcProvider("test-room", doc);
    const type = doc.getText("monaco");
    const binding = new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness);
    console.log(provider.awareness);                
  }

  const handleSaveButtonClick = async () => {
    const content = editorRef.current.getValue();
    setEditorContent(content);
    const res = await executeCode("javascript",content);
    console.log(res);
    
  };

  return (
    <div>
      <div>
        <Editor
          height="90vh"
          width="100vw"
          theme="vs-dark"
          onMount={handleEditorDidMount}
        />
      </div>
      <div>
        <button onClick={handleSaveButtonClick}>Save Editor Content</button>
      </div>
    </div>
  );
}

export default Collaborator;