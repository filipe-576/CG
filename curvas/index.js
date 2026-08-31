
class Point{
    constructor(x=0,y=0){
        this.x = x;
        this.y = y;
    }

    add(val){
        if( typeof val === "number" ){
            return new Point(this.x + val, this.y + val);
        }
        return new Point(this.x + val.x, this.y + val.y);
    }

    sub(val){
        if( typeof val === "number" ){
            return new Point(this.x - val, this.y - val);
        }
        return new Point(this.x - val.x, this.y - val.y);
    }
    
    mult(val){
        if( typeof val === "number" ){
            return new Point(this.x * val, this.y * val);
        }
        return new Point(this.x * val.x, this.y * val.y);
    }
}


/** @type {Point[]} */
let points = [];
/** @type {Point[]} */
let lerps = [];
let t = 0;
let isDragging = false;
let draggingPoint;

/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#canva");
canvas.height = 850;
canvas.width = 1600;
canvas.style.background = "#192d3ffa";
canvas.style.border = "7px solid #a14848";
const ctx = canvas.getContext("2d");
const clearBt = document.querySelector("#clear");
/** @type {HTMLInputElement} */
const slider = document.querySelector("#slider");
/** @type {HTMLInputElement} */
const showPointsButton = document.querySelector("#showPointsButton");

function drawPoint(x, y, color){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}

function drawCubicBezier(){
    // desenha as curvas 
    for( let i = 0; i < points.length-3; i += 3 ){
        let p0 = points[i];
        let p1 = points[i+1];
        let p2 = points[i+2];
        let p3 = points[i+3];
        let par1x = (-3)*p0.x + 3*p1.x
        let par2x = 3*p0.x - 6*p1.x + 3*p2.x
        let par3x = -p0.x + 3*p1.x - 3*p2.x + p3.x

        let par1y = (-3)*p0.y + 3*p1.y
        let par2y = 3*p0.y - 6*p1.y + 3*p2.y
        let par3y = -p0.y + 3*p1.y - 3*p2.y + p3.y

        for( let j = 0; j < 1; j += 0.001 ){
            lx = p0.x + j*par1x + (j**2)*par2x + (j**3)*par3x;
            ly = p0.y + j*par1y + (j**2)*par2y + (j**3)*par3y;

            ctx.fillStyle = "#cfcece";
            ctx.beginPath();
            ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    }

}

function navigatePoint(){
    let globalT = t * points.length;
    indexA = Math.trunc(globalT / 4);
    let pointA = points[indexA];
    let pointB = points[indexA+3];

    drawPoint(pointA.x, pointA.y, "blue");
    drawPoint(pointB.x, pointB.y, "blue");
    
}

function drawLine(x1, y1, x2, y2, color){
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
}

function renderScreen(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if( showPointsButton.checked ){
        // let a = points[]
        for( let i = 0; i < points.length-1; i +=3 ){
            
            const a = points[Math.max(i-1, 0)];
            const b = points[i];
            const c = points[Math.min(i+1, points.length-1)];
            console.log(Math.max(i-1, 0), i, Math.min(i+1, points.length-1));
            drawLine(a.x, a.y, b.x, b.y, "#88bdad");
            drawLine(b.x, b.y, c.x, c.y, "#88bdad");

            let l = lerp(points[i], points[i+1], t);
            drawPoint(l.x, l.y, "#9deeb6");
            // Mostra lerp de cada 2 pontos

        }
        if( points.length % 4 == 0 ){
            console.log(points.length-1, points.length-2);
            drawLine(points[points.length-1].x, points[points.length-1].y,
                points[points.length-2].x, points[points.length-2].y, "blue"
            );
        }
        
    }

    // desenha as curvas e o lerps
    drawCubicBezier();

    for( const point of points ){
        drawPoint(point.x, point.y, "#d45757");
    }

}


/**@param {Point} a */
/**@param {Point} b */
function lerp(a, b, t){
    return a.mult((1-t)).add(b.mult(t));
}

// Adicionar ponto na tela
canvas.addEventListener("click", (event) => {
    const x = event.offsetX;
    const y = event.offsetY;

    if(!isDragging){
        points.push(new Point(x, y));
    } else{
        isDragging = false;
    }
    renderScreen();
    

});

canvas.addEventListener("mousedown", (event) => {
    const x = event.offsetX;
    const y = event.offsetY;
    for( let i = 0; i < points.length; ++i ){
        if( Math.hypot(points[i].x - x, points[i].y - y) < 10 ){
            isDragging = true;
            pointToDrag = i;
            break;
        }
    }

});


canvas.addEventListener("mousemove", (event) =>{
    if( isDragging ){
        points[pointToDrag].x = event.offsetX;
        points[pointToDrag].y = event.offsetY;
        renderScreen();
    }
});

// Limpar tela
clearBt.addEventListener("click", () => {
    points = [];
    renderScreen();
});

slider.addEventListener("input", () => {
    t = Number(slider.value);
    renderScreen();
    // navigatePoint();
});

showPointsButton.addEventListener("input", () => {
    renderScreen();
});