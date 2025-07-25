import asyncio
import random
from js import document, window, THREE

# Game settings
GRID_SIZE = 20
CUBE_SIZE = 1
SNAKE_SPEED = 0.1  # Seconds per move

# Game state
snake = [[10, 10, 0]]  # Starting position [x, y, z]
direction = [1, 0, 0]  # Moving right initially
food = [random.randint(0, GRID_SIZE-1), random.randint(0, GRID_SIZE-1), 0]
score = 0
game_over = False

def setup():
    global scene, camera, renderer, snake_cubes, food_cube
    # Three.js setup
    scene = THREE.Scene.new()
    camera = THREE.PerspectiveCamera.new(75, 800/600, 0.1, 1000)
    camera.position.set(GRID_SIZE, GRID_SIZE, GRID_SIZE * 1.5)
    camera.lookAt(0, 0, 0)
    renderer = THREE.WebGLRenderer.new({'canvas': document.getElementById('game-canvas')})
    renderer.setSize(800, 600)
    window.scene = scene
    window.camera = camera
    window.renderer = renderer

    # Add lighting
    light = THREE.DirectionalLight.new(0xffffff, 0.5)
    light.position.set(GRID_SIZE, GRID_SIZE, GRID_SIZE)
    scene.add(light)
    # Add ambient light for soft overall illumination
    ambient_light = THREE.AmbientLight.new(0x404040)  # Soft white light
    scene.add(ambient_light)

    # Grid
    grid = THREE.GridHelper.new(GRID_SIZE, GRID_SIZE, 0x00ff00, 0x006600)
    scene.add(grid)

    # Snake
    snake_cubes = []
    geometry = THREE.BoxGeometry.new(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)
    material = THREE.MeshPhongMaterial.new({'color': 0x00ff00})  # Changed to MeshPhongMaterial
    for pos in snake:
        cube = THREE.Mesh.new(geometry, material)
        cube.position.set(pos[0] - GRID_SIZE/2, pos[1] - GRID_SIZE/2, pos[2])
        scene.add(cube)
        snake_cubes.append(cube)

    # Food
    food_material = THREE.MeshPhongMaterial.new({'color': 0xff0000})  # Changed to MeshPhongMaterial
    food_cube = THREE.Mesh.new(geometry, food_material)
    food_cube.position.set(food[0] - GRID_SIZE/2, food[1] - GRID_SIZE/2, food[2])
    scene.add(food_cube)

def update_loop():
    global snake, direction, food, score, game_over
    if game_over:
        return

    # Move snake
    head = [snake[0][0] + direction[0], snake[0][1] + direction[1], snake[0][2] + direction[2]]
    
    # Check collisions
    if (head[0] < 0 or head[0] >= GRID_SIZE or 
        head[1] < 0 or head[1] >= GRID_SIZE or 
        head in snake):
        game_over = True
        document.getElementById('game-over').style.display = 'block'
        return

    snake.insert(0, head)
    
    # Check food
    if head[0] == food[0] and head[1] == food[1]:
        score += 10
        document.getElementById('score').textContent = f'Score: {score}'
        food = [random.randint(0, GRID_SIZE-1), random.randint(0, GRID_SIZE-1), 0]
        food_cube.position.set(food[0] - GRID_SIZE/2, food[1] - GRID_SIZE/2, food[2])
    else:
        snake.pop()

    # Update snake visuals
    for i, cube in enumerate(snake_cubes):
        if i < len(snake):
            cube.position.set(snake[i][0] - GRID_SIZE/2, snake[i][1] - GRID_SIZE/2, snake[i][2])
        else:
            scene.remove(cube)
    while len(snake_cubes) < len(snake):
        cube = THREE.Mesh.new(THREE.BoxGeometry.new(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE), 
                            THREE.MeshPhongMaterial.new({'color': 0x00ff00}))  # Changed to MeshPhongMaterial
        scene.add(cube)
        snake_cubes.append(cube)

def handle_input(event):
    global direction
    key = event.key
    if key == 'ArrowUp' and direction != [0, 1, 0]:
        direction = [0, -1, 0]
    elif key == 'ArrowDown' and direction != [0, -1, 0]:
        direction = [0, 1, 0]
    elif key == 'ArrowLeft' and direction != [1, 0, 0]:
        direction = [-1, 0, 0]
    elif key == 'ArrowRight' and direction != [-1, 0, 0]:
        direction = [1, 0, 0]

document.addEventListener('keydown', handle_input)

async def main():
    setup()
    while True:
        update_loop()
        await asyncio.sleep(SNAKE_SPEED)

if __name__ == "__main__":
    asyncio.ensure_future(main())