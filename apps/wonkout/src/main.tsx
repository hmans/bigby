import { InputPlugin } from "@bigby/plugin-input"
import * as Physics from "@bigby/plugin-physics3d"
import { ThreePlugin } from "@bigby/plugin-three"
import { ThreePostprocessingPlugin } from "@bigby/plugin-three-postprocessing"
import { AnimationFrameTicker, App } from "bigby"
import { Ball } from "./Ball"
import { Bricks } from "./Bricks"
import { ConstantVelocityPlugin } from "./ConstantVelocityPlugin"
import { Floor } from "./Floor"
import { FollowCameraPlugin } from "./FollowCamera"
import "./index.css"
import { Player } from "./Player"
import { Scene } from "./Scene"
import { Walls } from "./Walls"

const app = new App()
  .use(AnimationFrameTicker)
  .use(ThreePlugin)
  .use(ThreePostprocessingPlugin)
  .use(InputPlugin)
  .use(Physics.Plugin({ gravity: [0, 0, 0] }))
  .use(ConstantVelocityPlugin)
  .use(FollowCameraPlugin)

/* Plugins are just functions. And they can load other plugins! */
const Wonkout = (app: App) =>
  app.use(Bricks).use(Floor).use(Walls).use(Player).use(Scene).use(Ball)

app.use(Wonkout)

app.start()

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      console.log("HMR received")
      app.stop()
    }
  })
}
