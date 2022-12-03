import { App } from "@bigby/core"

export class Input {
  move = {
    x: 0,
    y: 0
  }

  aim = {
    x: 0,
    y: 0
  }
}

export function InputPlugin(app: App) {
  const keys = new Set<string>()
  const entities = app.query([Input])

  const isPressed = (key: string) => (keys.has(key) ? 1 : 0)

  app.addStartupSystem(() => {
    document.addEventListener("keydown", (e) => {
      keys.add(e.code)
    })

    document.addEventListener("keyup", (e) => {
      keys.delete(e.code)
    })
  })

  app.addSystem(() => {
    entities.iterate((_, [input]) => {
      input.move.x = isPressed("KeyD") - isPressed("KeyA")
      input.move.y = isPressed("KeyW") - isPressed("KeyS")

      input.aim.x = isPressed("ArrowRight") - isPressed("ArrowLeft")
      input.aim.y = isPressed("ArrowUp") - isPressed("ArrowDown")
    })
  })

  return app
}
