var restore = () => {
  const visbug = document.createElement('vis-bug')
  visbug.setAttribute('extension', '')
  document.body.prepend(visbug)
  const platform = typeof browser === 'undefined' ? chrome : browser
  platform.storage.sync.get(['visbug-language'], values => {
    visbug.setAttribute('language', values['visbug-language'] || 'en')
  })
}

restore()
