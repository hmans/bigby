import { App, System } from "@bigby/core"
import { ThreeSystem } from "@bigby/plugin-three"
import {
  BlendFunction,
  BloomEffect,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  SMAAEffect,
  ToneMappingEffect,
  ToneMappingMode
} from "postprocessing"
import * as THREE from "three"

export const ThreePostprocessingPlugin = (app: App) => {
  const cameraQuery = app.query([THREE.Camera])

  /* When the application starts, disable the Three.js plugin's render loop
  so we can instead implement our own */
  app.onStart(() => {
    const three = app.getSingletonComponent(ThreeSystem)

    if (!three)
      throw new Error("Couldn't find any entity with ThreePluginState")

    three.render = false

    const composer = new EffectComposer(three.renderer, {
      frameBufferType: THREE.HalfFloatType
    })

    cameraQuery.onEntityAdded.add((entity) => {
      composer.reset()
      const camera = entity.get(THREE.Camera)!

      composer.addPass(new RenderPass(three.scene, camera))

      composer.addPass(
        new EffectPass(
          camera,
          new BloomEffect({
            mipmapBlur: true,
            luminanceThreshold: 1,
            intensity: 2
          })
        )
      )

      const effect = new NoiseEffect({
        blendFunction: BlendFunction.COLOR_DODGE
      })
      effect.blendMode.opacity.value = 0.045

      composer.addPass(
        new EffectPass(
          camera,
          new ToneMappingEffect({ mode: ToneMappingMode.REINHARD2_ADAPTIVE }),
          new SMAAEffect(),
          effect
        )
      )
    })

    class ThreePostprocessingSystem extends System {
      onRender(dt: number): void {
        composer.render()
      }
    }

    app.spawn([new ThreePostprocessingSystem(app)])
  })

  return app
}
