import { App, Entity, Object3D, System } from "@bigby/core"
import { clamp } from "@bigby/math"
import * as RAPIER from "@dimforge/rapier3d-compat"
import { ColliderHandle, RigidBodyDesc } from "@dimforge/rapier3d-compat"

export abstract class RigidBody {
  desc: RigidBodyDesc = undefined!
  raw?: RAPIER.RigidBody

  protected abstract initialize(): void

  constructor(fun?: (desc: RigidBodyDesc) => void) {
    this.initialize()
    fun?.(this.desc)
    return this
  }
}

export class DynamicBody extends RigidBody {
  protected initialize(): void {
    this.desc = RAPIER.RigidBodyDesc.dynamic()
  }
}

export class StaticBody extends RigidBody {
  protected initialize(): void {
    this.desc = RAPIER.RigidBodyDesc.fixed()
  }
}

export abstract class Collider {
  raw?: RAPIER.Collider
  abstract descriptor: RAPIER.ColliderDesc

  _onCollisionStart?: (other: Entity) => void
  _onCollisionEnd?: (other: Entity) => void

  setDensity(density: number) {
    this.descriptor.setDensity(density)
    return this
  }

  onCollisionStart(fn: (other: Entity) => void) {
    this._onCollisionStart = (other) => fn(other)
    return this
  }

  onCollisionEnd(fn: (other: Entity) => void) {
    this._onCollisionEnd = (other) => fn(other)
    return this
  }
}

export class BoxCollider extends Collider {
  descriptor: RAPIER.ColliderDesc

  constructor(size: [number, number, number] = [1, 1, 1]) {
    super()

    this.descriptor = RAPIER.ColliderDesc.cuboid(
      size[0] / 2,
      size[1] / 2,
      size[2] / 2
    )

    this.descriptor.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
  }
}

export class BallCollider extends Collider {
  descriptor: RAPIER.ColliderDesc

  constructor(radius: number) {
    super()

    this.descriptor = RAPIER.ColliderDesc.ball(radius)
    this.descriptor.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
  }
}

class PhysicsSystem extends System {
  world: RAPIER.World
  eventQueue = new RAPIER.EventQueue(true)

  /* Create new RAPIER colliders when entities appear */
  rigidbodyQuery = this.app.query([Object3D, RigidBody, Collider])

  /* Wire up colliders to their rigidbodies */
  collidersToComponent = new Map<ColliderHandle, Collider>()
  collidersToEntity = new Map<ColliderHandle, Entity>()

  constructor(
    app: App,
    { gravity = [0, -9.81, 0] }: { gravity?: [number, number, number] } = {}
  ) {
    super(app)

    this.world = new RAPIER.World({
      x: gravity[0],
      y: gravity[1],
      z: gravity[2]
    })
  }

  onStart(): void {
    /* Create new RAPIER rigidbodies when entities appear */
    this.rigidbodyQuery.onEntityAdded.add((entity) => {
      let desc = entity.get(RigidBody)!.desc

      const transform = entity.get(Object3D)!
      const rigidbody = entity.get(RigidBody)!

      desc.setTranslation(
        transform.position.x,
        transform.position.y,
        transform.position.z
      )

      desc.setRotation({
        x: transform.quaternion.x,
        y: transform.quaternion.y,
        z: transform.quaternion.z,
        w: transform.quaternion.w
      })

      rigidbody.raw = this.world.createRigidBody(desc)

      /* Also register collider */
      const collider = entity.get(Collider)!

      collider.raw = this.world.createCollider(
        collider.descriptor,
        rigidbody.raw
      )

      this.collidersToComponent.set(collider.raw.handle, collider)
      this.collidersToEntity.set(collider.raw.handle, entity)
    })

    /* Remove rigidbodies from the world */
    this.rigidbodyQuery.onEntityRemoved.add((entity) => {
      const rigidbody = entity.get(RigidBody)!
      const collider = entity.get(Collider)!

      this.collidersToComponent.delete(collider.raw!.handle)
      this.collidersToEntity.delete(collider.raw!.handle)
      this.world.removeRigidBody(rigidbody.raw!)
    })
  }

  onFixedUpdate(dt: number): void {
    /* Simulate physics world */
    this.world.timestep = clamp(dt, 0.01, 0.2)
    this.world.step(this.eventQueue)

    /* Check collisions */
    this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
      const collider1 = this.collidersToComponent.get(handle1)
      const collider2 = this.collidersToComponent.get(handle2)
      const entity1 = this.collidersToEntity.get(handle1)!
      const entity2 = this.collidersToEntity.get(handle2)!

      if (collider1 && collider2) {
        if (started) {
          collider1._onCollisionStart?.(entity2)
          collider2._onCollisionStart?.(entity1)
        } else {
          collider1._onCollisionEnd?.(entity2)
          collider2._onCollisionEnd?.(entity1)
        }
      }
    })

    /* Transfer physics transforms to the transform component */
    for (const [_, transform, rigidbody] of this.rigidbodyQuery) {
      const position = rigidbody.raw!.translation()
      transform.position.set(position.x, position.y, position.z)

      const rotation = rigidbody.raw!.rotation()
      transform.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)

      /* Reset forces */
      // rigidbody.raw!.resetForces(true)
    }
  }
}

export const Plugin =
  ({ gravity = [0, -9.81, 0] }: { gravity?: [number, number, number] } = {}) =>
  (app: App) =>
    app
      /* Make sure this component is known to the app. We'll need it! */
      .requireComponent(Object3D)

      /* Let the app know which components we will be adding. */
      .registerComponent(RigidBody)
      .registerComponent(Collider)

      /* Initialize Rapier (the physics engine) */
      .onLoad(RAPIER.init)

      /* Let's go! */
      .onStart((app) => {
        app.spawn([new PhysicsSystem(app, { gravity })])
      })
