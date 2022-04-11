class Point {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.show()
    }

    show(colour = 'black') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = colour
        ctx.fill();
    }
}

class AxisAlignedBoundingBox {
    constructor(x, y, sideLength) {
        this.x = x
        this.y = y
        this.sideLength = sideLength
        this.show()
    }

    contains(point) {
        return (
            this.x <= point.x &&
            point.x <= this.x + this.sideLength &&
            this.y <= point.y &&
            point.y <= this.y + this.sideLength
        )
    }

    intersects(aabb) {
        return !(
            aabb.x + aabb.sideLength < this.x ||
            this.x + this.sideLength < aabb.x ||
            aabb.y + aabb.sideLength < this.y ||
            this.y + this.sideLength < aabb.y)
    }

    show() {
        ctx.lineWidth = 1
        ctx.strokeStyle = 'black'
        ctx.strokeRect(this.x, this.y, this.sideLength, this.sideLength)
    }
}

class Quadtree {
    constructor(aabb, capacity) {
        this.aabb = aabb
        this.capacity = capacity
        this.points = []
        this.isDivided = false
    }

    subdivide() {
        let newSideLength = this.aabb.sideLength / 2
        let nw = new AxisAlignedBoundingBox(this.aabb.x, this.aabb.y, newSideLength)
        this.northwest = new Quadtree(nw, this.capacity)
        let ne = new AxisAlignedBoundingBox(this.aabb.x + newSideLength, this.aabb.y, newSideLength)
        this.northeast = new Quadtree(ne, this.capacity)
        let sw = new AxisAlignedBoundingBox(this.aabb.x, this.aabb.y + newSideLength, newSideLength)
        this.southwest = new Quadtree(sw, this.capacity)
        let se = new AxisAlignedBoundingBox(this.aabb.x + newSideLength, this.aabb.y + newSideLength, newSideLength)
        this.southeast = new Quadtree(se, this.capacity)
        this.isDivided = true
        this.points.forEach(p => {
            this.northwest.insert(p)
            this.northeast.insert(p)
            this.southwest.insert(p)
            this.southeast.insert(p)
        })
        this.points = []
    }

    insert(point) {
        if (!this.aabb.contains(point)) return
        if (this.points.length < this.capacity && !this.isDivided) {
            this.points.push(point)
        } else {
            if (!this.isDivided) this.subdivide()
            this.northwest.insert(point)
            this.northeast.insert(point)
            this.southwest.insert(point)
            this.southeast.insert(point)
        }
    }

    query(aabb) {
        if (!this.aabb.intersects(aabb)) return []
        if (!this.isDivided) {
            return [...this.points.filter(p => {
                p.show('orange')
                return aabb.contains(p)
            })]
        } else {
            return [
                ...this.northwest.query(aabb),
                ...this.northeast.query(aabb),
                ...this.southwest.query(aabb),
                ...this.southeast.query(aabb)]
        }
    }

    show(colour = 'black') {
        ctx.clearRect(0, 0, CANVAS_SIDE, CANVAS_SIDE)
        const inorderTraversal = (qt) => {
            qt.aabb.show()
            if (!qt.isDivided) {
                qt.points.forEach(p => p.show(colour))
            } else {
                inorderTraversal(qt.northwest)
                inorderTraversal(qt.northeast)
                inorderTraversal(qt.southwest)
                inorderTraversal(qt.southeast)
            }
        }
        inorderTraversal(this)
    }
}

// CANVAS
let CANVAS_SIDE = 800
const canvas = document.getElementById('canvas')
canvas.width = CANVAS_SIDE
canvas.height = CANVAS_SIDE
const ctx = canvas.getContext('2d')

// MOUSE EVENTS
canvas.oncontextmenu = (event) => event.preventDefault()

let mouseButtonDown = 0
canvas.onmousedown = (event) => {
    if (event.button === 2) {
        mouseButtonDown = 2
    } else {
        mouseButtonDown = 1
    }
}
canvas.onmouseup = () => {
    mouseButtonDown = 0
    qt.show()
}

let drawLimiter = 0
const leftClick = (event) => {
    drawLimiter++
    if (drawLimiter % 3 === 0) {
        qt.insert(new Point(event.clientX, event.clientY))
    }
}

const rightClick = (event) => {
    qt.show()
    ctx.lineWidth = 3
    ctx.strokeStyle = 'green'
    let side = 100
    ctx.strokeRect(event.clientX - 0.5 * side, event.clientY - 0.5 * side, side, side)
    const rect = new AxisAlignedBoundingBox(event.clientX - 0.5 * side, event.clientY - 0.5 * side, side)
    const points = qt.query(rect)
    points.forEach(p => p.show('green'))
}

canvas.onmousemove = (event) => {
    if (mouseButtonDown === 1) {
        leftClick(event)
    } else if (mouseButtonDown === 2) {
        rightClick(event)
    }
}

// QUADTREE
const aabb = new AxisAlignedBoundingBox(0, 0, CANVAS_SIDE)
const qt = new Quadtree(aabb, 4)