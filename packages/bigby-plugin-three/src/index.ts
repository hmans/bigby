import { App, System } from "@bigby/core"
import * as THREE from "three"

export * from "./helpers"

export class Parent3D {
  constructor(public parent: THREE.Object3D) {}
}

export class ThreeSystem extends System {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera?: THREE.Camera
  render = true

  constructor(
    app: App,
    {
      render = true,
      antialias = true
    }: { render?: boolean; antialias?: boolean } = {}
  ) {
    super(app)

    this.render = render

    this.renderer = new THREE.WebGLRenderer({
      powerPreference: "high-performance",
      antialias,
      stencil: false,
      depth: false
    })

    /* Configure Shadow Map */
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    /* Configure color space */
    THREE.ColorManagement.legacyMode = false
    this.renderer.outputEncoding = THREE.sRGBEncoding

    this.scene = new THREE.Scene()
  }

  onStart(): void {
    /* Mount our renderer */
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    /* Camera & Rendering */
    const cameras = this.app.query([THREE.Camera])

    /* When a new camera appears, register it as the main camera */
    cameras.onEntityAdded.add((entity) => {
      this.camera = entity.get(THREE.Camera)
    })

    /* When a camera disappears and it's our active camera, disable it */
    cameras.onEntityRemoved.add((entity) => {
      if (entity.get(THREE.Camera) === this.camera) this.camera = undefined
    })

    /* Resize the renderer when the window resizes */
    const onResize = () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight)

      if (this.camera instanceof THREE.PerspectiveCamera) {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
      } else if (this.camera instanceof THREE.OrthographicCamera) {
        this.camera.left = -window.innerWidth / 2
        this.camera.right = window.innerWidth / 2
        this.camera.top = window.innerHeight / 2
        this.camera.bottom = -window.innerHeight / 2
        this.camera.updateProjectionMatrix()
      }
    }

    window.addEventListener("resize", onResize)

    this.app.onStop(() => {
      window.removeEventListener("resize", onResize)
    })

    /* Scene Objects */
    /* Query the world for Three.js scene objects */
    const sceneObjects = this.app.query([THREE.Object3D])

    /* When an entity with a scene object appears, add it to the Three.js scene */
    sceneObjects.onEntityAdded.add((entity) => {
      const object3d = entity.get(THREE.Object3D)!
      this.scene.add(object3d)
    })

    /* When an entity with a scene object disappears, remove it from the Three.js scene */
    sceneObjects.onEntityRemoved.add((entity) => {
      this.scene.remove(entity.get(THREE.Object3D)!)
    })

    /* Custom Parenting */
    const parentedQuery = this.app.query([Parent3D, THREE.Object3D])

    parentedQuery.onEntityAdded.add((entity) => {
      const parent = entity.get(Parent3D)!.parent
      const object = entity.get(THREE.Object3D)!
      parent.add(object)
    })

    parentedQuery.onEntityRemoved.add((entity) => {
      const parent = entity.get(Parent3D)!.parent
      const object = entity.get(THREE.Object3D)!
      parent.remove(object)
    })
  }

  onStop(): void {
    console.debug("Disposing renderer")
    document.body.removeChild(this.renderer.domElement)
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }

  onRender(): void {
    if (!this.render) return
    if (!this.camera) return

    this.renderer.render(this.scene, this.camera)
  }
}

export const ThreePlugin = (app: App) => {
  app.registerComponent(THREE.Object3D)
  app.registerComponent(THREE.Camera)
  app.registerComponent(Parent3D)

  app.addSystem(ThreeSystem)

  return app
}
