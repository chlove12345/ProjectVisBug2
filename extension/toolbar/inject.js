var platform = typeof browser === 'undefined'
  ? chrome
  : browser

const script = document.createElement('script')
script.type = 'module'
script.src = platform.runtime.getURL('toolbar/bundle.min.js')
document.body.appendChild(script)

const visbug = document.createElement('vis-bug')
visbug.setAttribute('extension', '')

document.body.prepend(visbug)

platform.storage.sync.get(['visbug-language'], values => {
  visbug.setAttribute('language', values['visbug-language'] || 'en')
})

document.addEventListener('visbug-language-selected', event => {
  const language = event.target.getAttribute('language')
  if (language)
    platform.storage.sync.set({'visbug-language': language})
})

platform.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync' || !changes['visbug-language']) return
  document.querySelector('vis-bug')?.setAttribute(
    'language', changes['visbug-language'].newValue || 'en')
})

platform.runtime.onMessage.addListener(request => {
  if (request.action === 'COLOR_MODE')
    visbug.setAttribute('color-mode', request.params.mode)
  else if (request.action === 'COLOR_SCHEME')
    visbug.setAttribute("color-scheme", request.params.mode)
})
