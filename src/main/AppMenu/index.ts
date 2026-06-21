import EventEmitter from 'events'
import { Menu } from 'electron'
import { makeMenu } from './menu'
import { MyAppMenuConstructorOption } from './type'
import { BCURLPreference } from '../../urlprefer'

export class MyAppMenu extends EventEmitter<MyAppMenuEvent> {
  constructor (readonly options: Omit<MyAppMenuConstructorOption, 'BCVersion'>) {
    super()

    this.on('reload', () => {
      const BCVersion = BCURLPreference.choice
      const menu = makeMenu({ ...this.options, BCVersion })
      this.options.parent.window.setMenu(menu)
      if (process.platform === 'darwin') {
        Menu.setApplicationMenu(menu)
      }
      this.emit('reloaded', menu)
    })
  }
}
