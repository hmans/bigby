import { NonAbstractConstructor, World } from "@maxiplex/core"
import { EventDispatcher } from "@maxiplex/event-dispatcher"
import { System } from "./System"
import { SystemsPlugin } from "./SystemsPlugin"

export type Plugin = (app: App) => App | void

export type OnLoadCallback<A extends App> = (app: A) => void | Promise<void>
export type OnStartCallback<A extends App> = (app: A) => void | Promise<void>
export type OnStopCallback<A extends App> = (app: A) => void
export type UpdateCallback = (dt: number) => void

export class App extends World {
  onLoadCallbacks = new EventDispatcher<typeof this>()
  onStartCallbacks = new EventDispatcher<typeof this>()
  onStopCallbacks = new EventDispatcher<typeof this>()

  onEarlyUpdateCallbacks = new EventDispatcher<number>()
  onFixedUpdateCallbacks = new EventDispatcher<number>()
  onUpdateCallbacks = new EventDispatcher<number>()
  onLateUpdateCallbacks = new EventDispatcher<number>()
  onRenderCallbacks = new EventDispatcher<number>()

  protected registeredPlugins = new Set<Plugin>()

  constructor() {
    super()
    console.log("🐝 Bigby Initializing")
    this.use(SystemsPlugin)
  }

  use(plugin: Plugin) {
    if (this.registeredPlugins.has(plugin)) return this

    /* Register and initialize the plugin */
    this.registeredPlugins.add(plugin)
    const result = plugin(this)

    return result || this
  }

  addSystem<S extends System>(
    ctor: NonAbstractConstructor<S>,
    props: Partial<S> = {}
  ) {
    const system = new ctor(this)
    Object.assign(system, props)
    this.spawn([system])
    return this
  }

  onLoad(callback: OnLoadCallback<App>) {
    this.onLoadCallbacks.add(callback)
    return this
  }

  onStart(callback: OnStartCallback<App>) {
    this.onStartCallbacks.add(callback)
    return this
  }

  onStop(callback: OnStopCallback<App>) {
    this.onStopCallbacks.add(callback)
    return this
  }

  onEarlyUpdate(callback: UpdateCallback) {
    this.onEarlyUpdateCallbacks.add(callback)
    return this
  }

  onFixedUpdate(callback: UpdateCallback) {
    this.onFixedUpdateCallbacks.add(callback)
    return this
  }

  onUpdate(callback: UpdateCallback) {
    this.onUpdateCallbacks.add(callback)
    return this
  }

  onLateUpdate(callback: UpdateCallback) {
    this.onLateUpdateCallbacks.add(callback)
    return this
  }

  onRender(callback: UpdateCallback) {
    this.onRenderCallbacks.add(callback)
    return this
  }

  async start() {
    console.log("✅ Starting App")

    /* Execute and wait for initializers to complete */
    await this.onLoadCallbacks.emitAsync(this)

    /* Execute and wait for startupSystems to complete */
    await this.onStartCallbacks.emitAsync(this)

    return this
  }

  stop() {
    console.log("⛔ Stopping App")
    this.onStopCallbacks.emit(this)
    return this
  }
}
