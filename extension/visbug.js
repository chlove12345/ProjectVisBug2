import {gimmeToggle} from "./contextmenu/launcher.js"
import {getColorMode} from "./contextmenu/colormode.js"
import {getColorScheme} from "./contextmenu/colorscheme.js"

const state = {
  loaded:   {},
  injected: {},
}

var platform = typeof browser === 'undefined'
  ? chrome
  : browser

const languageTitles = {
  en: {
    launcher: 'Show/Hide',
    'color-mode': 'Colors',
    'color-scheme': 'Theme',
    auto: ' auto',
    light: ' light',
    dark: ' dark',
    action: 'Click or press Alt+Shift+D to launch VisBug2',
  },
  'zh-CN': {
    launcher: '显示/隐藏',
    'color-mode': '颜色',
    'color-scheme': '主题',
    auto: ' 自动',
    light: ' 浅色',
    dark: ' 深色',
    action: '点击或按 Alt+Shift+D 启动 VisBug2',
  },
}

const applyLanguageTitles = language => {
  const {action, ...menus} = languageTitles[language] || languageTitles.en
  Object.entries(menus).forEach(([id, title]) => {
    const pending = platform.contextMenus.update(id, {title})
    pending?.catch?.(() => undefined)
  })
  const pending = platform.action.setTitle({title: action})
  pending?.catch?.(() => undefined)
}

platform.storage.sync.get(['visbug-language'], values =>
  applyLanguageTitles(values['visbug-language']))

platform.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes['visbug-language'])
    applyLanguageTitles(changes['visbug-language'].newValue)
})

const toggleIn = async ({id:tab_id}) => {
  try {
    // toggle out: it's currently loaded and injected
    if (state.loaded[tab_id] && state.injected[tab_id]) {
      await platform.scripting.executeScript({
        target: {tabId: tab_id},
        files: ['toolbar/eject.js'],
      })
      state.injected[tab_id] = false
    }

    // toggle in: it's loaded and needs injected
    else if (state.loaded[tab_id] && !state.injected[tab_id]) {
      await platform.scripting.executeScript({
        target: {tabId: tab_id},
        files: ['toolbar/restore.js'],
      })
      state.injected[tab_id] = true
      getColorMode(tab_id)
      getColorScheme(tab_id)
    }

    // fresh start in tab
    else {
      await platform.scripting.insertCSS({
        target: {tabId: tab_id},
        files: ['toolbar/bundle.css' ],
      })
      await platform.scripting.executeScript({
        target: {tabId: tab_id},
        files: ['toolbar/inject.js'],
      })

      state.loaded[tab_id]    = true
      state.injected[tab_id]  = true
      getColorMode(tab_id)
      getColorScheme(tab_id)
    }
  }
  catch (error) {
    state.loaded[tab_id] = false
    state.injected[tab_id] = false
    console.error(`Could not toggle VisBug2 in tab ${tab_id}.`, error)
  }
}

platform.tabs.onUpdated.addListener((tab_id, change_info) => {
  if (change_info.status !== 'loading') return
  delete state.loaded[tab_id]
  delete state.injected[tab_id]
})

platform.tabs.onRemoved.addListener(tab_id => {
  delete state.loaded[tab_id]
  delete state.injected[tab_id]
})

gimmeToggle(toggleIn)
