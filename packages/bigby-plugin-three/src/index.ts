import { App, Transform } from "@bigby/core"
import * as THREE from "three"

export const ThreePlugin = (app: App) =>
  app.addStartupSystem((app) => {
    /* Create our renderer */
    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    /* Create the scene */
    const scene = new THREE.Scene()

    /* Query the world for Three.js scene objects */
    const sceneObjects = app.world.query([Transform, THREE.Object3D])

    /* When an entity with a scene object appears, add it to the Three.js scene */
    sceneObjects.onEntityAdded.add((entity) => {
      scene.add(entity.get(THREE.Object3D)!)
    })

    /* When an entity with a scene object disappears, remove it from the Three.js scene */
    sceneObjects.onEntityRemoved.add((entity) => {
      scene.remove(entity.get(THREE.Object3D)!)
    })

    /* Every frame, copy the transform data over to the Three.js objects */
    app.addSystem(() => {
      sceneObjects.iterate((_, [{ position, quaternion, scale }, object3d]) => {
        object3d.position.set(position[0], position[1], position[2])
        object3d.quaternion.set(
          quaternion[0],
          quaternion[1],
          quaternion[2],
          quaternion[3]
        )
        object3d.scale.set(scale[0], scale[1], scale[2])
      })
    })

    let activeCamera: THREE.Camera | undefined
    const cameras = app.world.query([THREE.Camera])

    /* When a new camera appears, register it as the main camera */
    cameras.onEntityAdded.add((entity) => {
      activeCamera = entity.get(THREE.Camera)
    })

    /* When a camera disappears and it's our active camera, disable it */
    cameras.onEntityRemoved.add((entity) => {
      if (entity.get(THREE.Camera) === activeCamera) activeCamera = undefined
    })

    /* Render every frame using the active camera if we have one */
    app.addSystem(() => {
      if (activeCamera) renderer.render(scene, activeCamera)
    })
  })