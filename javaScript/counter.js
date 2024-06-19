let count = 0

function addOne(){
    count += 1
    update()
}
function addTen(){
    count += 10
    update()
}
function subOne(){
    count -= 1
    update()
}
function subTen(){
    count -= 10
    update()
}
function reset(){
    count = 0
    update()
}

function update(){
    document.getElementById("count-view").innerText = count
}