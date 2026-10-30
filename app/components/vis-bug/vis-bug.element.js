import $          from 'blingblingjs'
import hotkeys    from 'hotkeys-js'
import '@shoelace-style/shoelace/dist/components/radio-group/radio-group.js'
import '@shoelace-style/shoelace/dist/components/radio-button/radio-button.js'

import {
  Handles, Handle, Label, Overlay, Gridlines, Corners,
  Hotkeys, Metatip, Ally, Distance, BoxModel, Grip, Rotation
} from '../'

import {
  Selectable, Moveable, Padding, Margin, EditText, Font,
  Flex, Search, ColorPicker, BoxShadow, HueShift, MetaTip,
  Guides, Screenshot, Position, Accessibility, draggable, HistoryManager
} from '../../features/'

import {
  VisBugStyles,
  HistoryControlsStyles,
  VisBugLightStyles,
  VisBugDarkStyles
} from '../styles.store'

import { VisBugModel }            from './model'
import * as Icons                 from './vis-bug.icons'
import { getLanguage, getSavedLanguage, setLanguage, languageOptions, toolPresentation, translate, localize } from '../../localization'
import { provideSelectorEngine }  from '../../features/search'
import {
  PluginRegistry,
  registerPlugin as registerVisBugPlugin,
  setPluginActive
} from '../../plugins/_registry'
import {
  metaKey,
  isPolyfilledCE,
  constructibleStylesheetSupport,
  schemeRule
} from '../../utilities/'

export default class VisBug extends HTMLElement {
  constructor() {
    super()

    this.toolbar_model  = VisBugModel
    this.$shadow        = this.attachShadow({mode: 'closed'})
    this.promoteTooltip = this.promoteTooltip.bind(this)
    this.applyLanguage = this.applyLanguage.bind(this)
    this.closeSettings = this.closeSettings.bind(this)
    this.applyScheme    = schemeRule(
      this.$shadow,
      VisBugStyles, VisBugLightStyles, VisBugDarkStyles
    )
  }

  static get observedAttributes() {
    return ['color-scheme', 'language']
  }

  connectedCallback() {
    this.history = new HistoryManager()
    setLanguage(this.getAttribute('language') || getSavedLanguage())

    this.setup()
    this.setupHistoryControls()
    document.addEventListener('visbug-language-change', this.applyLanguage)

    this.selectorEngine = Selectable(this, this.history)
    this.colorPicker    = ColorPicker(this.$shadow, this.selectorEngine, this.history)

    provideSelectorEngine(this.selectorEngine)

    this.toolSelected($('[data-tool="guides"]', this.$shadow)[0])
  }

  disconnectedCallback() {
    document.removeEventListener('visbug-language-change', this.applyLanguage)
    this.stopHistoryControls?.()
    this.historyControls?.remove()
    this.closeSettings()
    this.deactivate_feature()
    this.cleanup()
    this.selectorEngine.disconnect()
    hotkeys.unbind(
      Object.keys(this.toolbar_model).reduce((events, key) =>
        events += ',' + key, ''))
    hotkeys.unbind(`${metaKey}+/`)
    hotkeys.unbind(`${metaKey}+z,${metaKey}+shift+z,${metaKey}+y`)
    this.history.clear()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'color-scheme') {
      this.applyScheme(newValue)
      this.applyHistoryScheme?.(newValue)
    }
    if (name === 'language' && newValue !== oldValue)
      setLanguage(newValue)
  }

  setup() {
    this.$shadow.innerHTML = this.render()
    this.applyLanguage()

    const trigger = this.$shadow.querySelector('[data-settings-trigger]')
    const dialog = this.$shadow.querySelector('[data-settings-dialog]')
    trigger.addEventListener('click', () => {
      dialog.showModal()
      trigger.setAttribute('aria-expanded', 'true')
    })
    this.$shadow.querySelector('[data-settings-close]').addEventListener('click', this.closeSettings)
    dialog.addEventListener('close', () => {
      trigger.setAttribute('aria-expanded', 'false')
      if (this.isConnected) trigger.focus()
    })
    dialog.addEventListener('keydown', event => event.stopPropagation())
    this.$shadow.querySelector('[data-language]').addEventListener('sl-change', event => {
      const language = event.target.value
      setLanguage(language, true)
      this.setAttribute('language', language)
      this.dispatchEvent(new CustomEvent('visbug-language-selected', {
        bubbles: true,
        detail: {language},
      }))
    })

    this.hasAttribute('color-mode')
      ? this.getAttribute('color-mode')
      : this.setAttribute('color-mode', 'hex')

    this.hasAttribute('color-scheme')
      ? this.getAttribute('color-scheme')
      : this.setAttribute('color-scheme', 'auto')

    this.setAttribute('popover', 'manual')
    this.showPopover && this.showPopover()

    const main_ol = this.$shadow.querySelector('ol:not([colors])')
    const buttonPieces = $('li[data-tool], li[data-tool] *', main_ol)

    main_ol.addEventListener('pointerover', this.promoteTooltip)

    const clickEvent = (e) => {
      const target = e.currentTarget || e.target
      const toolButton = target.closest('[data-tool]')
      if (toolButton) this.toolSelected(toolButton) && e.stopPropagation();
    }

    Array.from(buttonPieces)
    .forEach(toolButton => {
      draggable({
        el:this,
        surface: toolButton,
        cursor: 'pointer',
        clickEvent: clickEvent
      })
    })

    draggable({
      el:this,
      surface: main_ol,
      cursor: 'grab',
    })

    Object.entries(this.toolbar_model).forEach(([key, value]) =>
      hotkeys(key, e => {
        e.preventDefault()
        this.toolSelected(
          $(`[data-tool="${value.tool}"]`, this.$shadow)[0]
        )
      })
    )

    const isEditing = target => target?.isContentEditable
      || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)

    hotkeys(`${metaKey}+z`, e => {
      if (isEditing(e.target)) return
      if (this.history.undo()) e.preventDefault()
    })

    hotkeys(`${metaKey}+shift+z,${metaKey}+y`, e => {
      if (isEditing(e.target)) return
      if (this.history.redo()) e.preventDefault()
    })

    hotkeys(`${metaKey}+/,${metaKey}+.`, e =>
      this.toggleVisibility())
  }

  setupHistoryControls() {
    this.historyControls = document.createElement('visbug-history-controls')
    this.$historyShadow = this.historyControls.attachShadow({mode: 'closed'})
    this.applyHistoryScheme = schemeRule(this.$historyShadow, HistoryControlsStyles)
    this.applyHistoryScheme(this.getAttribute('color-scheme'))
    this.$historyShadow.innerHTML = `
      <button type="button" data-undo aria-label="Undo" title="Undo" disabled>${Icons.undo}</button>
      <button type="button" data-redo aria-label="Redo" title="Redo" disabled>${Icons.redo}</button>
    `

    this.$historyShadow.querySelector('[data-undo]').addEventListener('click', () => this.history.undo())
    this.$historyShadow.querySelector('[data-redo]').addEventListener('click', () => this.history.redo())
    this.$historyShadow.addEventListener('keydown', event => event.stopPropagation())
    this.stopHistoryControls = this.history.subscribe(() => this.updateHistoryControls())
    this.historyControls.style.display = this.style.display
    document.body.append(this.historyControls)
    this.updateHistoryControls()
    localize(this.$historyShadow)
  }

  updateHistoryControls() {
    this.$historyShadow.querySelector('[data-undo]').disabled = !this.history.canUndo()
    this.$historyShadow.querySelector('[data-redo]').disabled = !this.history.canRedo()
  }

  toggleVisibility() {
    this.style.display = this.style.display === 'none' ? 'block' : 'none'
    this.historyControls.style.display = this.style.display
  }

  cleanup() {
    this.hidePopover && this.hidePopover()

    Array.from(document.body.children)
      .filter(node => node.nodeName.includes('VISBUG'))
      .forEach(el => el.remove())

    this.teardown()

    document.querySelectorAll('[data-pseudo-select=true]')
      .forEach(el =>
        el.removeAttribute('data-pseudo-select'))
  }

  promoteTooltip({target, relatedTarget}) {
    const toolButton = target.closest?.('li[data-tool]')

    if (!toolButton || toolButton.contains(relatedTarget)) return
    if (!this.showPopover || !this.matches(':popover-open')) return

    // Selection UI is promoted into the browser's top layer as it changes.
    // Re-promote the toolbar when a tool tip opens so its overflow paints last.
    this.hidePopover()
    this.showPopover()
  }

  closeSettings() {
    const dialog = this.$shadow.querySelector('[data-settings-dialog]')
    if (dialog?.open) dialog.close()
  }

  applyLanguage() {
    this.setAttribute('lang', getLanguage())
    Object.values(this.toolbar_model).forEach(tool => {
      const item = this.$shadow.querySelector(`[data-tool="${tool.tool}"]`)
      if (!item) return
      const presentation = toolPresentation(tool)
      item.setAttribute('aria-label', presentation.ariaLabel)
      item.setAttribute('aria-description', presentation.ariaDescription)
      item.querySelector('[data-tool-label]').innerHTML = presentation.labelHtml
      item.querySelector('[data-tool-description]').innerHTML = presentation.descriptionHtml
    })
    const languageControl = this.$shadow.querySelector('[data-language]')
    if (languageControl) {
      languageControl.value = getLanguage()
      languageControl.label = translate('Language')
    }
    localize(this.$shadow)
    localize(this.$historyShadow)
    document.querySelectorAll('visbug-rotation, visbug-handle, visbug-projective-transform')
      .forEach(element => localize(element.$shadow))
  }

  toolSelected(el) {
    if (typeof el === 'string')
      el = $(`[data-tool="${el}"]`, this.$shadow)[0]

    this.closeSettings()
    if (this.active_tool && this.active_tool.dataset.tool === el.dataset.tool) return

    if (this.active_tool) {
      this.active_tool.attr('data-active', null)
      this.deactivate_feature()
    }

    el.attr('data-active', true)
    this.active_tool = el
    document.dispatchEvent(new CustomEvent('visbug-tool-change', {
      detail: {tool: el.dataset.tool},
    }))
    this[el.dataset.tool]()
  }

  render() {
    return `
      <visbug-hotkeys></visbug-hotkeys>
      <ol constructible-support="${constructibleStylesheetSupport ? 'false':'true'}">
        ${Object.entries(this.toolbar_model).reduce((list, [key, tool]) => `
          ${list}
          <li aria-label="${tool.label} Tool" aria-description="${tool.description}" aria-hotkey="${key}" data-tool="${tool.tool}" data-active="${key == 'g'}">
            ${tool.icon}
            ${this.demoTip({key, ...tool})}
          </li>
        `,'')}
      </ol>
      <ol colors>
        <li class="color" id="foreground" aria-label="Text" aria-description="Change the text color">
          <input type="color">
          ${Icons.color_text}
        </li>
        <li class="color" id="background" aria-label="Background or Fill" aria-description="Change the background color or fill of svg">
          <input type="color">
          ${Icons.color_background}
        </li>
        <li class="color" id="border" aria-label="Border or Stroke" aria-description="Change the border color or stroke of svg">
          <input type="color">
          ${Icons.color_border}
        </li>
      </ol>
      <ol settings>
        <li data-settings>
          <button type="button" data-settings-trigger aria-label="Settings" title="Settings" aria-haspopup="dialog" aria-expanded="false" aria-controls="visbug-settings">
            ${Icons.settings}
          </button>
        </li>
      </ol>
      <dialog id="visbug-settings" data-settings-dialog aria-labelledby="visbug-settings-title">
        <header>
          <h2 id="visbug-settings-title">Settings</h2>
          <button type="button" data-settings-close aria-label="Close">&times;</button>
        </header>
        <sl-radio-group data-language label="Language">
          ${languageOptions.map(({value, name}) =>
            `<sl-radio-button value="${value}">${name}</sl-radio-button>`).join('')}
        </sl-radio-group>
      </dialog>
    `
  }

  demoTip({key, tool, label, description, instruction}) {
    return `
      <aside ${tool}>
        <figure>
          <figcaption>
            <h2>
              <span data-tool-label>${label}</span>
              <span hotkey>${key}</span>
            </h2>
            <p data-tool-description>${description}</p>
            ${instruction}
          </figcaption>
        </figure>
      </aside>
    `
  }

  move() {
    this.deactivate_feature = Moveable(this.selectorEngine, this.history)
  }

  margin() {
    this.deactivate_feature = Margin(this.selectorEngine, this.history)
  }

  padding() {
    this.deactivate_feature = Padding(this.selectorEngine, this.history)
  }

  font() {
    this.deactivate_feature = Font(this.selectorEngine, this.history)
  }

  text() {
    const editText = elements => EditText(elements, this.history)
    this.selectorEngine.onSelectedUpdate(editText)
    this.deactivate_feature = () =>
      this.selectorEngine.removeSelectedCallback(editText)
  }

  align() {
    this.deactivate_feature = Flex(this.selectorEngine, this.history)
  }

  search() {
    this.deactivate_feature = Search($('[data-tool="search"]', this.$shadow))
  }

  boxshadow() {
    this.deactivate_feature = BoxShadow(this.selectorEngine, this.history)
  }

  hueshift() {
    this.deactivate_feature = HueShift({
      Color:  this.colorPicker,
      Visbug: this.selectorEngine,
      history: this.history,
    })
  }

  inspector() {
    this.deactivate_feature = MetaTip(this.selectorEngine)
  }

  accessibility() {
    this.deactivate_feature = Accessibility(this.selectorEngine)
  }

  guides() {
    this.deactivate_feature = Guides(this.selectorEngine)
  }

  screenshot() {
    this.deactivate_feature = Screenshot()
  }

  position() {
    let feature = Position(this.history)
    this.selectorEngine.onSelectedUpdate(feature.onNodesSelected)
    this.deactivate_feature = () => {
      this.selectorEngine.removeSelectedCallback(feature.onNodesSelected)
      feature.disconnect()
    }
  }

  execCommand(command, context = {}) {
    const query = `/${command}`

    if (PluginRegistry.has(query))
      return PluginRegistry.get(query)({
        selected: this.selectorEngine.selection(),
        query,
        ...context,
      })

    return Promise.resolve(new Error("Query not found"))
  }

  registerPlugin(plugin) {
    return registerVisBugPlugin(plugin)
  }

  setPluginActive(id, active) {
    return setPluginActive(id, active)
  }

  get activeTool() {
    return this.active_tool.dataset.tool
  }
}

customElements.define('vis-bug', VisBug)
