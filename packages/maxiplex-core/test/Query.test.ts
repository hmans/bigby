import { Query } from "../src/Query"
import { createWorldWithComponents, Health, Position, Velocity } from "./common"

describe(Query, () => {
  it("queries the world for entities that have a specific set of components", () => {
    const world = createWorldWithComponents()

    const entity = world.spawn([new Position(), new Velocity()])

    const moving = new Query(world, [Position, Velocity])
    expect(moving.entities).toEqual([entity])

    const withHealth = new Query(world, [Health])
    expect(withHealth.entities).toEqual([])
  })

  describe("iterate", () => {
    it("loops over all entities contained in the query", () => {
      const world = createWorldWithComponents()

      world.spawn([new Position(), new Velocity()])

      const moving = new Query(world, [Position, Velocity])
      moving.iterate((entity, position, velocity) => {
        expect(entity).toBeDefined()
        expect(position).toBeInstanceOf(Position)
        expect(velocity).toBeInstanceOf(Velocity)
      })
    })
  })

  describe("Symbol.iterator", () => {
    it("iterates over contained entities in reverse", () => {
      const world = createWorldWithComponents()

      const entity1 = world.spawn([new Position(), new Velocity()])
      const entity2 = world.spawn([new Position(), new Velocity()])
      const moving = new Query(world, [Position, Velocity])

      expect([...moving]).toEqual([
        [entity2, entity2.get(Position), entity2.get(Velocity)],
        [entity1, entity1.get(Position), entity1.get(Velocity)]
      ])
    })
  })
})
