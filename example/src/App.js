import React from 'react'

import { NotionCloneEditor } from 'web_package_test'
import 'web_package_test/dist/index.css'

const App = () => {
  const [pullData, setPullData] = React.useState(false);
  const [fetchedData, setFetchedData] = React.useState([]);

  React.useEffect(
    () => {
      console.log(fetchedData);
      setPullData(false);
    }, [ fetchedData ]
  )

  return (
    <>
      <NotionCloneEditor
        pullData={pullData}
        setterFxn={setFetchedData}
      />
      <button onClick={() => {
        setPullData(true);
      }}>show data </button>
    </>
  )
}

export default App
