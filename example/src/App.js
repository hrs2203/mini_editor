import React, { useState } from 'react'

import { NotionCloneEditor, getInitialState, getEditorData } from 'web_package_test'

import 'web_package_test/dist/index.css'

const App = () => {
  const [ourEditor, setOurEditor] = useState(getInitialState);

  return (
    <>
      <NotionCloneEditor
        customEditor={ourEditor}
        setCustomEditor={setOurEditor}
      />
      <div style={{ "marginLeft": "10px" }}>
        <pre>
          {JSON.stringify(getEditorData(ourEditor), undefined, " ")}
        </pre>
      </div>
    </>
  )
}

export default App
