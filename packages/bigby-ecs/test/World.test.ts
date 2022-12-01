import { Query, World } from "../src"

class Position {
  constructor(public x = 0, public y = 0) {}
}

class Velocity {
  constructor(public x = 0, public y = 0) {}
}

class Health {
  constructor(public current = 100, public max = current) {}
}

describe(World, () => {
  it("should create a world", () => {
    const world = new World()
    expect(world).toBeInstanceOf(World)
  })

  describe("spawn", () => {
    it("creates an entity with the given components", () => {
      const world = new World()

      const position = new Position()
      const velocity = new Velocity()
      const health = new Health()

      const entity = world.spawn([position, velocity, health])

      expect(entity).toBeDefined()
      expect(entity[0]).toBe(position)
      expect(entity[1]).toBe(velocity)
      expect(entity[2]).toBe(health)
    })
  })

  describe("query", () => {
    it("creates a Query object", () => {
      const world = new World()
      const query = world.query([Position, Velocity, Health])
      expect(query).toBeInstanceOf(Query)
    })
  })
})

describe(Query, () => {
  it("queries the world for entities that have a specific set of components", () => {
    const world = new World()

    const entity = world.spawn([new Position(), new Velocity()])

    const moving = new Query(world, [Position, Velocity])
    expect(moving.entities).toEqual([entity])

    const withHealth = new Query(world, [Health])
    expect(withHealth.entities).toEqual([])
  })
})
