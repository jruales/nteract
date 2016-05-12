import React from 'react';

import remark from 'remark';
import reactRenderer from 'remark-react';
import { loadMathJax, mathProcessor } from 'mathjax-electron';

import Editor from './editor';

const markdownRenderer = remark().use(reactRenderer);

// Initialize the mathjax renderer.
loadMathJax(document);

export default class MarkdownCell extends React.Component {
  static propTypes = {
    cell: React.PropTypes.any,
    id: React.PropTypes.string,
    theme: React.PropTypes.string,
    focusAbove: React.PropTypes.func,
    focusBelow: React.PropTypes.func,
    focused: React.PropTypes.bool,
  };

  static contextTypes = {
    dispatch: React.PropTypes.func,
  };

  static defaultProps = {
    focused: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      view: true,
      // HACK: We'll need to handle props and state change better here
      source: this.props.cell.get('source'),
    };
    this.openEditor = this.openEditor.bind(this);
    this.editorKeyDown = this.editorKeyDown.bind(this);
    this.renderedKeyDown = this.renderedKeyDown.bind(this);
  }

  componentDidMount() {
    this.updateRenderedElement();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      source: nextProps.cell.get('source'),
    });
  }

  componentDidUpdate() {
    this.updateRenderedElement();
  }

  updateRenderedElement() {
    // On first load, if focused, focus rendered view
    if (this.state && this.state.view) {
      if (this.props.focused) {
        this.refs.rendered.focus();
      }

      // Render the math in the rendered markdown.
      mathProcessor(this.refs.rendered);
    }
  }

  /**
   * Handles when a keydown event occurs on the unrendered MD cell
   */
  editorKeyDown(e) {
    const shift = e.shiftKey;
    const ctrl = e.ctrlKey;
    if ((shift || ctrl) && e.key === 'Enter') {
      this.setState({ view: true });
    }
  }

  openEditor() {
    this.setState({ view: false });
  }

  /**
   * Handles when a keydown event occurs on the rendered MD cell
   */
  renderedKeyDown(e) {
    switch (e.key) {
      case 'ArrowUp':
        this.props.focusAbove();
        break;
      case 'ArrowDown':
        this.props.focusBelow();
        break;
      case 'Enter':
        this.openEditor();
        e.preventDefault();
        return false;
      default:
    }
    return true;
  }

  render() {
    return (
        (this.state && this.state.view) ?
          <div
            className="cell_markdown rendered"
            onDoubleClick={this.openEditor}
            onKeyDown={this.renderedKeyDown}
            ref="rendered"
            tabIndex="0"
          >
            {markdownRenderer.process(
              this.state.source ?
                this.state.source :
                '*Empty markdown cell, double click me to add content.*')
            }
          </div> :
          <div onKeyDown={this.editorKeyDown} className="cell_markdown unrendered">
            <Editor
              language="markdown"
              id={this.props.id}
              lineWrapping
              input={this.state.source}
              theme={this.props.theme}
              focusAbove={this.props.focusAbove}
              focusBelow={this.props.focusBelow}
              focused={this.props.focused}
            />
          </div>
    );
  }
}
