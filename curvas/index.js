
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
const clearBt = document.querySelector("#clearButton");
/** @type {HTMLInputElement} */
const slider = document.querySelector("#slider");
/** @type {HTMLInputElement} */
const showHelpersButton = document.querySelector("#showHelpersButton");
const undoButton = document.querySelector("#undoButton");
/** @type {NodeListOf<HTMLInputElement>} */
const splineRadioGroup = document.querySelectorAll('input[name="sRadios"]');
let splineChoice = "s0";

function drawPoint(x, y, color, size){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}

function drawCubicBezierSpline(){
    // desenha as splines auxiliares
    if( showHelpersButton.checked){
        for( let i = 0; i < points.length; i +=3 ){
            const a = points[Math.max(i-1, 0)];
            const b = points[i];
            const c = points[Math.min(i+1, points.length-1)];
            drawLine(a.x, a.y, b.x, b.y, "#88bdad");
            drawLine(b.x, b.y, c.x, c.y, "#88bdad");
        }
    }
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

function drawCatmullRomSpline(){
    if( points.length < 2) return;
    const firstAnchor = points[1].mult(2).sub(points[0]);
    const lastAnchor = points[points.length-2].mult(2).sub(points[points.length-1]);
    const catmullPoints = [firstAnchor].concat(points);
    catmullPoints.push(lastAnchor);

    if( showHelpersButton.checked ){
        drawPoint(firstAnchor.x, firstAnchor.y, "#cfcece", 8);
        drawPoint(lastAnchor.x, lastAnchor.y, "#cfcece", 8);
    }

    for( let i = 0; i < catmullPoints.length-3; ++i ){
        const p0 = catmullPoints[i];
        const p1 = catmullPoints[i+1];
        const p2 = catmullPoints[i+2];
        const p3 = catmullPoints[i+3];
        const par1x = (-p0.x + p2.x)/2
        const par2x = (2*p0.x - 5*p1.x + 4*p2.x - p3.x)/2
        const par3x = (-p0.x + 3*p1.x - 3*p2.x + p3.x)/2

        const par1y = (-p0.y + p2.y)/2
        const par2y = (2*p0.y - 5*p1.y + 4*p2.y - p3.y)/2
        const par3y = (-p0.y + 3*p1.y - 3*p2.y + p3.y)/2

        for( let j = 0; j < 1; j += 0.001 ){
            const lx = p1.x + j*par1x + (j**2)*par2x + (j**3)*par3x;
            const ly = p1.y + j*par1y + (j**2)*par2y + (j**3)*par3y;

            ctx.fillStyle = "#cfcece";
            ctx.beginPath();
            ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    }
}

function navigatePoint(){
    if( points.length < 4 ) return;

    let point;
    switch( splineChoice ){
        case "s0": // bezier
        {
            const globalT = t * (points.length-1)/3;
            const index = Math.trunc(globalT) * 3;
            const localT = globalT - Math.trunc(globalT);
            const p0 = points[index];
            const p1 = points[index+1];
            const p2 = points[index+2];
            const p3 = points[index+3];
            const a = lerp(p0, p1, localT);
            const b = lerp(p1, p2, localT);
            const c = lerp(p2, p3, localT);
            const d = lerp(a, b, localT);
            const e = lerp(b, c, localT);
            point = lerp(d, e, localT);
            break;
        }
        case "s1": // catmull
        {
            const globalT = t * (points.length-1);
            const index = Math.trunc(globalT);
            const localT = globalT - Math.trunc(globalT);
            const firstAnchor = points[1].mult(2).sub(points[0]);
            const lastAnchor = points[points.length-2].mult(2).sub(points[points.length-1]);
            const catmullPoints = [firstAnchor].concat(points);
            catmullPoints.push(lastAnchor);
            const p0 = catmullPoints[index];
            const p1 = catmullPoints[index+1];
            const p2 = catmullPoints[index+2];
            const p3 = catmullPoints[index+3];
            const par1x = (-p0.x + p2.x)/2
            const par2x = (2*p0.x - 5*p1.x + 4*p2.x - p3.x)/2
            const par3x = (-p0.x + 3*p1.x - 3*p2.x + p3.x)/2
            
            let par1y = (-p0.y + p2.y)/2
            let par2y = (2*p0.y - 5*p1.y + 4*p2.y - p3.y)/2
            let par3y = (-p0.y + 3*p1.y - 3*p2.y + p3.y)/2
            const x = p1.x + localT*par1x + (localT**2)*par2x + (localT**3)*par3x;
            const y = p1.y + localT*par1y + (localT**2)*par2y + (localT**3)*par3y;
            point = new Point(x, y);
            break;
        }
        default:
            console.log("deu merda");
            break;
    } 

    drawPoint(point.x, point.y, "green", 8);
    
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
    // desenha as curvas
    switch (splineChoice) {
        case "s0":
            drawCubicBezierSpline();
            break;
        case "s1":
            drawCatmullRomSpline();
            break;
        default:
            console.log("deu merda");
            break;
    }

    for( const point of points ){
        drawPoint(point.x, point.y, "#d45757", 8);
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

// Arrastar ponto
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

undoButton.addEventListener("click", () => {
    points.pop();
    renderScreen();
});

slider.addEventListener("input", () => {
    t = Number(slider.value);
    renderScreen();
    navigatePoint();
});

showHelpersButton.addEventListener("input", () => {
    renderScreen();
});

splineRadioGroup.forEach(radio => {
    radio.addEventListener("change", (event) => {
        splineChoice = event.target.value;
        renderScreen();
    });
});