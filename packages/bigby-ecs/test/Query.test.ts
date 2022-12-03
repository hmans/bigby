import { World } from "../src"
import { Query } from "../src/Query"
import { Health, Position, Velocity } from "./common"

describe(Query, () => {
  it("queries the world for entities that have a specific set of components", () => {
    const world = new World().registerComponent(Position, Velocity, Health)

    const entity = world.add([new Position(), new Velocity()])

    const moving = new Query(world, [Position, Velocity])
    expect(moving.entities).toEqual([entity])

    const withHealth = new Query(world, [Health])
    expect(withHealth.entities).toEqual([])
  })

  describe("iterate", () => {
    it("loops over all entities contained in the query", () => {
      const world = new World().registerComponent(Position, Velocity, Health)

      world.add([new Position(), new Velocity()])

      const moving = new Query(world, [Position, Velocity])
      moving.iterate((entity, [position, velocity]) => {
        expect(entity).toBeDefined()
        expect(position).toBeInstanceOf(Position)
        expect(velocity).toBeInstanceOf(Velocity)
      })
    })
  })
})
