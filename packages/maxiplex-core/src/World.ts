import { EventDispatcher } from "@maxiplex/event-dispatcher"
import { Entity } from "./Entity"
import { processComponent } from "./helpers"
import { Query } from "./Query"
import { Component, ComponentQuery, Constructor } from "./types"

export type BaseEntity = {}

export class World {
  constructor() {}

  entities = new Array<Entity>()
  protected registeredComponents = new Set<Component>()

  onEntityAdded = new EventDispatcher<Entity>()
  onEntityRemoved = new EventDispatcher<Entity>()
  onEntityUpdated = new EventDispatcher<Entity>()

  protected queries = new Map<string, Query<any>>()

  spawn(components: (Component | Constructor<Component>)[] = []) {
    /* Instantiate components where only the constructor was given */
    const processed = components.map(processComponent)

    /* Check all given components if they've been registered with us */
    processed.forEach((component) => {
      this.assertRegisteredComponent(component.constructor)
    })

    /* Create a new entity */
    const entity = new Entity(this)
    entity.components.push(...processed)

    /* Add the entity to the world */
    this.entities.push(entity)
    this.onEntityAdded.emit(entity)

    return entity
  }

  destroy(entity: Entity) {
    /* Remove entity */
    const index = this.entities.indexOf(entity)
    if (index !== -1) {
      this.entities.splice(index, 1)
      this.onEntityRemoved.emit(entity)
    }

    return entity
  }

  registerComponent(ctor: Constructor<Component>) {
    this.registeredComponents.add(ctor)
    return this
  }

  addComponent(entity: Entity, component: Component) {
    /* Check if the component has been registered with us */
    this.assertRegisteredComponent(component.constructor)

    /* check if the component is already present */
    if (entity.components.some((c) => c.constructor === component.constructor))
      return false

    /* Add the component to the entity */
    entity.components.push(component)

    /* Emit the event */
    this.onEntityUpdated.emit(entity)

    return true
  }

  removeComponent(
    entity: Entity,
    component: Component | Constructor<Component>
  ) {
    /* Remove the component from the entity */
    const index = entity.components.findIndex(
      (c) => c === component || c.constructor === component
    )
    if (index === -1) return false

    /* Remove the component from the entity */
    entity.components.splice(index, 1)

    /* Emit the onEntityUpdated event */
    this.onEntityUpdated.emit(entity)

    return true
  }

  getSingletonComponent<T extends Component>(ctor: Constructor<T>) {
    this.assertRegisteredComponent(ctor)
    /* TODO: optimize this! */
    return this.query([ctor]).first?.get(ctor)
  }

  requireComponent(...query: Constructor<Component>[]) {
    query.forEach((ctor) => this.assertRegisteredComponent(ctor))
    return this
  }

  private assertRegisteredComponent(ctor: Constructor<Component>) {
    /* Check our list of component constructors */
    if (this.registeredComponents.has(ctor)) return

    /* Check if the given component uses a child class */
    for (const registered of this.registeredComponents) {
      if (ctor.prototype instanceof registered) return
    }

    /* Otherwise, throw an error */
    throw new Error(
      `Component "${ctor.name}" unknown. Did you forget to register it first, or add a plugin that does this?`
    )
  }

  query<Q extends readonly Component[]>(query: ComponentQuery<Q>): Query<Q> {
    /* Check if all these components have been registered with us */
    query.forEach((ctor) => this.assertRegisteredComponent(ctor))

    /* Memoize query instances */
    /* TODO: find a better way to build a key */
    const key = query.toString()

    if (!this.queries.has(key)) {
      this.queries.set(key, new Query<Q>(this, query))
    }

    return this.queries.get(key)!
  }
}
