import React from 'react';
import { Editor, EditorState, convertToRaw, SelectionState, Modifier, CompositeDecorator } from 'draft-js';

const globalDecorationStratergy = new CompositeDecorator([
  {
    strategy: (contentBlock, callback, contentState) => {
      const text = contentBlock.getText();
      const len = text.length;
      let i = 0;
      while (i < len) {
        let j = i;
        while ((text[j] !== " ") && (j < len)) {
          j += 1;
        }
        callback(i, j);
        i = j + 1;
      }
    },
    component: (props) => {
      const entityKey = props.entityKey;
      const entData = entityKey === null ? {} : props.contentState.getEntity(entityKey).getData();
      const defaultStyle = {
        "fontStyle": "normal", "fontWeight": "normal"
      }
      const customStyle = entityKey === null ? defaultStyle : {
        ...defaultStyle,
        "fontStyle": entData["i"] === true ? "italic" : defaultStyle["fontStyle"],
        "fontWeight": entData["b"] === true ? "bold" : defaultStyle["fontWeight"],
        "textDecoration": entData["u"] === true ? "underline" : ""
      }
      return <span style={customStyle}>{props.children}</span>
    },
  }
]);

export const getInitialState = () => EditorState.createEmpty(globalDecorationStratergy);

export const NotionCloneEditor = ({
  isDebug = false,
  decorationStratergy = globalDecorationStratergy,
  customEditor = null,
  setCustomEditor = () => { }
}) => {


  const handelChange = (newEditorState) => {
    setCustomEditor(newEditorState);
  }

  const customStyle = {
    "border": "1px solid black",
    "margin": "10px",
    "padding": "3px"
  }

  const selectUpdate = (changeKeyValues) => {
    let contentState = customEditor.getCurrentContent();
    const selectionState = customEditor.getSelection();
    const startKey = selectionState.getStartKey();
    const endKey = selectionState.getEndKey();
    if (startKey !== endKey) {
      alert("multiple line select not allowed for the momment")
    }
    else {
      const contentBlock = contentState.getBlockForKey(startKey);
      let startIndex = selectionState.getStartOffset();
      let endIndex = selectionState.getEndOffset();
      if (selectionState.isCollapsed()) {
        console.log("nothing selected");
      } else {
        const text = contentBlock.getText()
        const textLength = text.length;
        // both indexes are inclusive
        while ((startIndex > 0) && (text[startIndex - 1] !== " ")) {
          startIndex -= 1;
        }
        while ((endIndex < textLength - 1) && (text[endIndex] !== " ")) {
          endIndex += 1;
        }
        endIndex = (endIndex === textLength - 1) ? endIndex : (endIndex - 1);

        while (startIndex < endIndex) {
          let j = startIndex;
          while ((j < endIndex) && (text[j] !== " ")) {
            j += 1;
          }
          j = (j === endIndex) ? j : (j - 1);
          // console.log(text.slice(startIndex, j + 1), startIndex, j, j - startIndex + 1);
          // ========= operations ===========

          const entityKey = contentBlock.getEntityAt(startIndex);
          if (entityKey === null) {
            // create a new one
            const newSelection = new SelectionState({
              anchorKey: startKey,
              focusKey: startKey,
              anchorOffset: startIndex,
              focusOffset: j + 1,
              isBackward: false,
            });
            contentState = contentState.createEntity("TOKEN", "MUTABLE", changeKeyValues)
            const lastCreatedKey = contentState.getLastCreatedEntityKey();
            contentState = Modifier.applyEntity(contentState, newSelection, lastCreatedKey);
          } else {
            // update existing
            const tempEntity = contentState.getEntity(entityKey);
            const newData = { ...tempEntity.getData(), ...changeKeyValues }
            contentState = contentState.replaceEntityData(entityKey, newData);
          }
          // ================================
          startIndex = j + 2;
        }
        const newEditorState = EditorState.createWithContent(contentState, decorationStratergy);
        setCustomEditor(newEditorState);
      }
    }
  }

  return (
    <div style={customStyle}>
      <div>
        <button
          style={{ "paddingLeft": "8px", "paddingRight": "8px", "marginRight": "3px" }}
          onClick={() => { selectUpdate({ "b": true }) }}
        ><b>b</b></button>
        <button
          style={{ "paddingLeft": "8px", "paddingRight": "8px", "marginRight": "3px" }}
          onClick={() => { selectUpdate({ "i": true }) }}
        ><i>i</i></button>
        <button
          style={{ "paddingLeft": "8px", "paddingRight": "8px", "marginRight": "3px" }}
          onClick={() => { selectUpdate({ "u": true }) }}
        ><u>u</u></button>
        <button
          style={{ "paddingLeft": "8px", "paddingRight": "8px", "marginRight": "3px" }}
          onClick={() => { selectUpdate({ "b": false }) }}
        ><b>un b</b></button>
        <button
          style={{ "paddingLeft": "8px", "paddingRight": "8px", "marginRight": "3px" }}
          onClick={() => { selectUpdate({ "i": false }) }}
        ><i>un i</i></button>
        <button
          style={{ "paddingLeft": "8px", "paddingRight": "8px", "marginRight": "3px" }}
          onClick={() => { selectUpdate({ "u": false }) }}
        ><u>un u</u></button>
      </div>
      <br />
      <Editor
        editorState={customEditor}
        onChange={handelChange}
      />
      {
        isDebug && (
          <button onClick={() => {
            console.log(convertToRaw(customEditor.getCurrentContent()));
          }}>log data</button>
        )
      }
      <br />

    </div>
  )
}

export function getEditorData(myEditor = undefined, defaultEntity = {}, start = 0, end = -1) {
  try {
    const contentState = myEditor.getCurrentContent();
    let result = [];
    const blockKeys = contentState.getBlocksAsArray().map(item => item.getKey());
    for (const ky of blockKeys) {
      const block = contentState.getBlockForKey(ky);
      const blockText = block.getText();
      const textLength = end === -1 ? blockText.length : end;
      let ind = start;
      // to mitigate initial whitespaces
      while ((ind < textLength) && (blockText[ind] === " ")) {
        ind += 1;
      }
      while (ind < textLength) {
        if ((ind === start) || (blockText[ind - 1] === " ")) {
          const entKey = block.getEntityAt(ind);
          let j = ind;
          while (j < textLength && blockText[j] !== " ") {
            j += 1
          }
          const tWord = blockText.substring(ind, j);
          if (entKey === null) {
            result.push({ text: tWord, ...defaultEntity });
          } else {
            const ent = contentState.getEntity(entKey);
            result.push({ text: tWord, ...ent.getData() })
          }
        }
        ind += 1
      }
    }
    return result;
  } catch (e) {
    return {}
  }
}