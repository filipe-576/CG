
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

function getCubicBezierParam(p0, p1, p2, p3){
    return {
        a1: (-3)*p0 + 3*p1,
        a2: 3*p0 - 6*p1 + 3*p2,
        a3: -p0 + 3*p1 - 3*p2 + p3
    }
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
    ctx.strokeStyle = "#cfcece";
    ctx.lineWidth = 6;
    ctx.beginPath();
    for( let i = 0; i < points.length-3; i += 3 ){
        let p0 = points[i];
        let p1 = points[i+1];
        let p2 = points[i+2];
        let p3 = points[i+3];
        const paramX = getCubicBezierParam(p0.x, p1.x, p2.x, p3.x);
        const paramY = getCubicBezierParam(p0.y, p1.y, p2.y, p3.y);

        for( let j = 0; j <= 50; j += 1 ){
            const t = j / 50;
            const lx = p0.x + t*(paramX.a1 + t*(paramX.a2 + t*paramX.a3));
            const ly = p0.y + t*(paramY.a1 + t*(paramY.a2 + t*paramY.a3));

            if( j == 0 ) ctx.moveTo(lx, ly);
            else ctx.lineTo(lx, ly);
        }
    }
    ctx.stroke();

}

function getCatmullRomParam(p0, p1, p2, p3){
    return {
        a1: (-p0 + p2)/2,
        a2: (2 * p0 - 5 * p1 + 4 * p2 - p3)/2,
        a3: (-p0 + 3 * p1 - 3 * p2 + p3)/2
    }
}

function drawCatmullRomSpline(){
    if( points.length < 2) return;
    const firstAnchor = points[0].mult(2).sub(points[1]);
    const lastAnchor = points[points.length-1].mult(2).sub(points[points.length-2]);
    const catmullPoints = [firstAnchor].concat(points);
    catmullPoints.push(lastAnchor);

    if( showHelpersButton.checked ){
        drawPoint(firstAnchor.x, firstAnchor.y, "#cfcece", 8);
        drawPoint(lastAnchor.x, lastAnchor.y, "#cfcece", 8);
    }

    ctx.strokeStyle = "#cfcece";
    ctx.lineWidth = 6;
    ctx.beginPath();
    for( let i = 0; i < catmullPoints.length-3; ++i ){
        const p0 = catmullPoints[i];
        const p1 = catmullPoints[i+1];
        const p2 = catmullPoints[i+2];
        const p3 = catmullPoints[i+3];
        const paramX = getCatmullRomParam(p0.x, p1.x, p2.x, p3.x);
        const paramY = getCatmullRomParam(p0.y, p1.y, p2.y, p3.y);

        for( let j = 0; j < 50; ++j ){
            const t = j / 50;
            const lx = p1.x + t*(paramX.a1 + t*(paramX.a2 + t*paramX.a3));
            const ly = p1.y + t*(paramY.a1 + t*(paramY.a2 + t*paramY.a3));

            if( j == 0 ) ctx.moveTo(lx, ly);
            else ctx.lineTo(lx, ly);
        }
    }
    ctx.stroke();
}

function getBSplineParam(p0, p1, p2, p3){
    return {
        a0: (p0 + 4*p1 + p2)/6,
        a1: (-p0 + p2)/2,
        a2: (p0 - 2*p1 + p2)/2,
        a3: (-p0 + 3*p1 - 3*p2 + p3)/6
    }
}

function drawBSpline(){
    if(showHelpersButton.checked){
        for( let i = 0; i < points.length-1; ++i ){
            const a = points[i];
            const b = points[i+1];
            drawLine(a.x, a.y, b.x, b.y, "#88bdad");
        }
    }

    let BSplinePoints = [];
    ctx.strokeStyle = "#cfcece";
    ctx.lineWidth = 6;
    ctx.beginPath();
    let lx, ly;
    for( let i = 0; i < points.length-3; ++i ){
        const p0 = points[i];
        const p1 = points[i+1];
        const p2 = points[i+2];
        const p3 = points[i+3];
        const paramX = getBSplineParam(p0.x, p1.x, p2.x, p3.x);
        const paramY = getBSplineParam(p0.y, p1.y, p2.y, p3.y);

        for( let j = 0; j < 50; ++j ){
            const t = j / 50;
            lx = paramX.a0 + t*(paramX.a1 + t*(paramX.a2 + t*paramX.a3));
            ly = paramY.a0 + t*(paramY.a1 + t*(paramY.a2 + t*paramY.a3));
            
            if( j == 0 ){
                BSplinePoints.push(new Point(lx, ly));
                ctx.moveTo(lx, ly);
            }
            else ctx.lineTo(lx, ly);
        }
    }
    if( points.length >= 3 ){
        BSplinePoints.push(new Point(lx, ly));
    }
    ctx.stroke();

    for( const point of BSplinePoints ){
        drawPoint(point.x, point.y, "#618bff", 8);
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
            const paramX = getCubicBezierParam(p0.x, p1.x, p2.x, p3.x);
            const paramY = getCubicBezierParam(p0.y, p1.y, p2.y, p3.y);
            const lx = p0.x + localT*(paramX.a1 + localT*(paramX.a2 + localT*paramX.a3));
            const ly = p0.y + localT*(paramY.a1 + localT*(paramY.a2 + localT*paramY.a3));
            point = new Point(lx, ly);
            break;
        }
        case "s1": // catmull
        {
            const globalT = t * (points.length-1);
            const index = Math.trunc(globalT);
            const localT = globalT - Math.trunc(globalT);
            const firstAnchor = points[0].mult(2).sub(points[1]);
            const lastAnchor = points[points.length-1].mult(2).sub(points[points.length-2]);
            const catmullPoints = [firstAnchor].concat(points);
            catmullPoints.push(lastAnchor);
            const p0 = catmullPoints[index];
            const p1 = catmullPoints[index+1];
            const p2 = catmullPoints[index+2];
            const p3 = catmullPoints[index+3];
            const paramX = getCatmullRomParam(p0.x, p1.x, p2.x, p3.x);
            const paramY = getCatmullRomParam(p0.y, p1.y, p2.y, p3.y);

            const x = p1.x + localT*(paramX.a1 + localT*(paramX.a2 + localT*paramX.a3));
            const y = p1.y + localT*(paramY.a1 + localT*(paramY.a2 + localT*paramY.a3));
            point = new Point(x, y);
            break;
        }
        case "s2":
            {
                const globalT = t * (points.length-3);
                const index = Math.trunc(globalT);
                const localT = globalT - Math.trunc(globalT);
                const p0 = points[index];
                const p1 = points[index+1];
                const p2 = points[index+2];
                const p3 = points[index+3];
                const paramX = getBSplineParam(p0.x, p1.x, p2.x, p3.x);
                const paramY = getBSplineParam(p0.y, p1.y, p2.y, p3.y);
                
                const x = paramX.a0 + localT*(paramX.a1 + localT*(paramX.a2 + localT*paramX.a3));
                const y = paramY.a0 + localT*(paramY.a1 + localT*(paramY.a2 + localT*paramY.a3));

                point = new Point(x, y);
                break;
            }
        default:
            console.log("deu merda");
            break;
    } 

    drawPoint(point.x, point.y, "green", 12);
    
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
        case "s2":
            drawBSpline();
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
            draggingPoint = i;
            break;
        }
    }

});


canvas.addEventListener("mousemove", (event) =>{
    if( isDragging ){
        points[draggingPoint].x = event.offsetX;
        points[draggingPoint].y = event.offsetY;
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