const StructDi = require('ref-struct-di')
const ref = require('ref-napi')
const ffi = require('ffi-napi') // Foreign-Function Interface

/* In reality I am programming C here, through Javascript 
Not idiomatic Javascript / NodeJS. */

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


  // Create Windows Process that handles the Window as Parent process
function main(){
  // The Window-Message Callback
  const WndProc = ffi.Callback(
    W.UINT32,
    [W.HWND, W.UINT, W.WPARAM, W.LPARAM],
    (hwnd, uMsg, wParam, lParam) => {
      console.info('WndProc callback: ', uMsg , wParam, lParam)
      let result = 0
      switch (uMsg) {
        default:
          result = user32.DefWindowProcW(hwnd, uMsg, wParam, lParam)
          break
      }
      console.info('Sending LRESULT: ' + result + '\n')
      if(uMsg == 16){
        process.exit(0);
      }
      return result
    }
  )

  const msg = new Struct(DS.MSG)()
  const point = new Struct(DS.POINT)()

  msg.pt = point.ref() // Message Pointer

  const hWnd = createWindow("Mini Windows Application", WndProc)

  while (user32.GetMessageW(msg.ref(), hWnd, 0, 0)) { 
    user32.TranslateMessageEx(msg.ref())
    user32.DispatchMessageW(msg.ref())
    console.log(msg.wParam)

    if(msg.message == 563){
      for(let structmember in msg){
        console.log(structmember, msg[structmember])
      }
      process.exit(0);
    }
  }

  if(msg.message == 16){
    process.exit(0);
  }

  // avoid gc
  process.on('exit', () => {
    console.info('typeof WndProc is ' + typeof WndProc)
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
  const dragAndDrop = true
  const exStyle = dragAndDrop ? U.constants.WS_EX_ACCEPTFILES : 0
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