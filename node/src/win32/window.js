const StructDi = require('ref-struct-di')
const ref = require('ref-napi')
const ffi = require('ffi-napi') // Foreign-Function Interface


const {
  C,
  DModel,
  DStruct,
  DTypes,
  FModel,
  U,
} = require('win32-api');

const M = DModel
const DS = DStruct
const W = DTypes
const FM = FModel

const Struct = StructDi(ref)

const user32 = U.load()
const comctl32 = C.load() 

function main(){

  // Create Windows Process that handles the Window as Parent process
  const WndProc = ffi.Callback(
    W.UINT32,
    [W.HWND, W.UINT, W.WPARAM, W.LPARAM],
    (hwnd, uMsg, wParam, lParam) => {
      console.info('WndProc callback: ', uMsg, wParam, lParam)
      let result = 0
      switch (uMsg) {
        default:
          result = user32.DefWindowProcW(hwnd, uMsg, wParam, lParam)
          break
      }
      console.info('Sending LRESULT: ' + result + '\n')
      return result
    }
  )

  const msg = new Struct(DS.MSG)()
  const point = new Struct(DS.POINT)()

  msg.pt = point.ref() // Message Pointer


  // Timer for Window Lifetime

  let count = 0
  const countLimit = 500
  const start = new Date().getTime()
  const ttl = 30 // sec

  const hWnd = createWindow("Mini Windows Application", WndProc)

  while (count < countLimit && user32.GetMessageW(msg.ref(), hWnd, 0, 0)) {
    count++
    console.log('---------- count: ' + count + ' ------------')

    const end = new Date().getTime()
    const delta = end - start
    if (delta > ttl * 1000) {
      console.info(`timeout and exit. count: ${count}`)
      console.info(`elp ${delta}ms`)
      process.exit(0)
    }
    else if (count >= countLimit) {
      console.info('countLimit and exit.')
      console.info(`elp ${delta}ms`)
      process.exit(0)
    }

    user32.TranslateMessageEx(msg.ref())
    user32.DispatchMessageW(msg.ref())
  }
  console.log("Exit from While loop")
  // avoid gc
  process.on('exit', () => {
    console.info('typeof WndProc is ' + typeof WndProc)
    console.info(`${count} loops`)
  })
}

function createWindow(title, proc) {
  const className = Buffer.from('NodeClass\0', 'ucs2')
  const windowName = Buffer.from('Node.js WinForms App\0', 'ucs2')

  // Common Controls
  const icc = new Struct(DS.INITCOMMONCONTROLSEX)()
  icc.dwSize = 8
  icc.dwICC = 0x40ff
  comctl32.InitCommonControlsEx(icc.ref())

  // Window Class
  const wClass = new Struct(DS.WNDCLASSEX)()

  wClass.cbSize = wClass.ref().byteLength
  wClass.style = 0
  wClass.lpfnWndProc = proc
  wClass.cbClsExtra = 0
  wClass.cbWndExtra = 0
  wClass.hInstance = 0
  wClass.hIcon = 0
  wClass.hCursor = 0
  wClass.hbrBackground = 0
  wClass.lpszMenuName = ref.NULL
  wClass.lpszClassName = className
  wClass.hIconSm = 0

  if (!user32.RegisterClassExW(wClass.ref())) {
    throw new Error('Error registering class')
  }
  // const dStyle = U.constants.WS_OVERLAPPEDWINDOW
  const exStyle = U.constants.WS_EX_ACCEPTFILES
  const dStyle = U.constants.WS_CAPTION | U.constants.WS_SYSMENU
  const hWnd = user32.CreateWindowExW(
    exStyle,
    className,
    windowName,
    dStyle, // overlapped window
    U.constants.CW_USEDEFAULT,
    U.constants.CW_USEDEFAULT,
    600,
    400,
    0,
    0,
    0,
    ref.NULL,
  )
  
  user32.ShowWindow(hWnd, 1)
  user32.UpdateWindow(hWnd)
  changeTitle(hWnd, title)
  return hWnd
}

function changeTitle(hWnd, title) {
  const bufhWnd = Buffer.from([hWnd])
  if (hWnd && !ref.isNull(bufhWnd) && ref.address(bufhWnd)) {
    // Change title of the Calculator
    const res = user32.SetWindowTextW(hWnd, Buffer.from(title + '\0', 'ucs2'))

    if (!res) {
      console.error('failed with', res)
      return ''
    }
    else {
      // const tt = getTitle(handle)
      return ''
    }
  }
  else {
    return ''
  }
}

module.exports = main;