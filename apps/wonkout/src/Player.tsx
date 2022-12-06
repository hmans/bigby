import { Input } from "@bigby/plugin-input"
import * as Physics from "@bigby/plugin-physics3d"
import { loadGLTF } from "@bigby/plugin-three"
import { App, apply, make, setup } from "bigby"
import { Object3D } from "three"

export class PlayerComponent {
  thrust = 50
  angularThrust = 10
}

export const Player = (app: App) => {
  app.registerComponent(PlayerComponent)

  app.onStart(async (app) => {
    const gltf = await loadGLTF("/models/wonkout_paddle.gltf")

    /* Player */
    app.spawn([
      make(PlayerComponent, {
        thrust: 40,
        angularThrust: 15
      }),

      make(Input),

      new Physics.DynamicBody((desc) =>
        desc
          .enabledRotations(false, false, true)
          .enabledTranslations(true, true, false)
          .setLinearDamping(5)
          .setAngularDamping(3)
      ),

      new Physics.BoxCollider([5, 1, 1]).setDensity(10),

      setup(
        apply(gltf.scene.children[0]!.clone(), { castShadow: true }),
        (obj: Object3D) => obj.position.set(0, -8.5, 0)
      )
    ])

    const playerQuery = app.query([PlayerComponent])

    app.onUpdate(() => {
      const player = playerQuery.first

      if (player) {
        const { move, aim } = player.get(Input)!
        const rigidbody = player.get(Physics.RigidBody)!
        const { thrust, angularThrust } = player.get(PlayerComponent)!

        const rb = rigidbody.raw!
        rb.resetForces(false)
        rb.resetTorques(false)

        /* Move */
        rb.applyImpulse({ x: move.x * thrust, y: move.y * thrust, z: 0 }, true)

        /* Rotate */
        rb.applyTorqueImpulse({ x: 0, y: 0, z: aim.x * -angularThrust }, true)
      }
    })
  })
  return app
}
