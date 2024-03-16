import React, { useRef, useState, useEffect } from 'react';
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";
import { executeCode } from '../api';
import LanguageSelector from './LanguageSelector';
import { CODE_SNIPPETS } from '../constants';
import Output from './Output';

function Collaborator() {
  const editorRef = useRef(null);
  const [editorContent, setEditorContent] = useState("");
  const [value, setValue] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [provider, setProvider] = useState(null);
  const prevLanguage = useRef(language); // Track previous language for re-render

  const onSelect = (language) => {
    setLanguage(language);
    setValue(CODE_SNIPPETS[language]);
    // Broadcast language change
    const doc = provider.doc;
    const langBinding = doc.getText('language');
    langBinding.delete(0, langBinding.toString().length);
    langBinding.insert(0, language);
  };

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    const doc = new Y.Doc();
    const newProvider = new WebrtcProvider("test-room", doc);
    const type = doc.getText("monaco");
    const binding = new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), newProvider.awareness);
    setProvider(newProvider);

    // Listen for language changes
    const langBinding = doc.getText('language');
    langBinding.observe(event => {
      const newLanguage = event.changes.delta[0].retain;
      monaco.editor.setModelLanguage(editorRef.current.getModel(), newLanguage);
    });
  }

  const handleSaveButtonClick = async () => {
    const content = editorRef.current.getValue();
    setEditorContent(content);
    const res = await executeCode(language, content);
    console.log(res);
  };

  return (
    <div style={{ margin: '30px' }}>
      <LanguageSelector language={language} onSelect={onSelect} provider={provider}/>
      <div>
        <Editor
          height="60vh"
          width="50vw"
          theme="vs-dark"
          onMount={handleEditorDidMount}
          language={language} // Pass language prop to the editor
        />
        <Output editorRef={editorRef} language={language}/>
      </div>
      <div>
        <button onClick={handleSaveButtonClick}>Save Editor Content</button>
      </div>
    </div>
  );
}

export default Collaborator;
