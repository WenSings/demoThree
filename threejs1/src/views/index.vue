<template>
    <div class="Main">
        <div v-show="loading<100||!isgameing" class="load">
            <div>
                <div :style="'width:'+loading+'%'"></div>
            </div>
            <div class="btn" @click="startGame()">
                开始游戏
            </div>
        </div>
        <div v-show="isgameing" class="ui">
            <div class="mine">
                <div class="playerMsg">
                    <span>{{mine.name}}</span>
                    <div>
                        <div :style="'width:'+mine.blood+'%'"></div>
                    </div>
                    <span class="score">{{mine.blood}}</span>
                </div>
                <div class="m-sc">分数：{{mine.score}}</div>
            </div>
            <div class="players">
                <div class="playerMsg" v-for="item in playerMsg">
                    <span>{{item.name}}</span>
                    <div>
                        <div :style="'width:'+item.blood+'%'"></div>
                    </div>
                    <span >{{item.score}}</span>
                </div>
            </div>
        </div>
        <div class="zunxin">
            <div :class="doShot?'shot':''"></div>
        </div>
        <div id="three"></div>
    </div>
</template>
<script setup>
import {onMounted,ref,onUnmounted} from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import * as CANNON from "cannon-es";
import CannonDebugger from 'cannon-es-debugger'
let scene,camera,renderer,controls,firstControls,cannonDebugger
onMounted(()=>{
    ws.onopen=da=>{
      init()
      createScene()
      animation()
      connect_model()
    }
})
// const ws=new WebSocket('ws://8.138.80.212:9001')
const ws=new WebSocket('ws://192.168.20.9:9001')

onUnmounted(()=>{
  window.cancelAnimationFrame(animationId)
})
const loading = ref(0)
const isgameing=ref(false)
function startGame(){
    if(loading.value==100){
        isgameing.value = true
        document.getElementById('three').requestPointerLock()
        eventListener()
    }
}
function init(){
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
    renderer = new THREE.WebGLRenderer({
        antialias:true,
    })
    renderer.setSize(window.innerWidth,window.innerHeight)
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('three').appendChild(renderer.domElement)
    // controls = new OrbitControls( camera, renderer.domElement );
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('/image/sky_hdr.hdr', function (envMap) {
        scene.environment = envMap;
        scene.background  = envMap;
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        loading.value=100
    },function(e){
        loading.value=e.loaded/e.total*99
    })
    const light = new THREE.PointLight(  0xffffff, 100000, 0 );
    light.shadow.mapSize.width = 1512; // default
    light.shadow.mapSize.height = 1512; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 1000; // default
    light.castShadow = true;
    light.position.set(350,150,0)
    scene.add( light );
    scene.add(cubeGroup)
    scene.add(sphereGroup)
    scene.add(monsterGroup)
    scene.add(cssLabel)
    scene.add(otherPlayer)
    scene.add(otherSphere)
}
function createCube(size,color){
    const geometry = new THREE.BoxGeometry( size[0], size[1], size[2] ); 
    const material = new THREE.MeshStandardMaterial( {color: color} ); 
    const cube = new THREE.Mesh( geometry, material );
    cube.castShadow=true
    cube.receiveShadow=true
    return cube
}
function createSphere(size,color){
    const geometry = new THREE.SphereGeometry( size[0],size[1],size[2] );
    const material = new THREE.MeshStandardMaterial( { color: color } );
    const sphere = new THREE.Mesh( geometry, material );
    sphere.castShadow=true
    sphere.receiveShadow=true
    return sphere
}
function createBuilding(){
    for(let i=0;i<150;i++){
        let scale=[Math.random()*50,Math.random()*50,Math.random()*50]
        let pos=[Math.random()*300-150,Math.random()*50+50,Math.random()*300-150]
        let c=createCube(scale,new THREE.Color(Math.random(),Math.random(),Math.random()))
        c.position.set(pos[0],pos[1],pos[2])
        let bodyBox = new CANNON.Body({
            mass: scale[0]*scale[1]*scale[2],
            position: new CANNON.Vec3(pos[0],pos[1],pos[2]),
            shape: new CANNON.Box(new CANNON.Vec3(scale[0]/2,scale[1]/2,scale[2]/2)),
            material: boxMaterial
        });
        c.userData = bodyBox;
        world.addBody(bodyBox);
        cubeGroup.add(c)
    }
}
function createMonster(){
    let man=createCube([1,2,1],'#333')
    let header=createCube([0.5,0.5,0.8],'#999')
    header.position.set(0,0.8,0.5)
    monsterGroup.add(man,header)
    monsterGroup.position.set(0,15,0)
    let bodyBox = new CANNON.Body({
        mass: 500,
        position: new CANNON.Vec3(0,15,0),
        shape:new CANNON.Box(new CANNON.Vec3(0.51,1.01,0.51)),
        material:humanMaterial
    });
    bodyBox.name='monster'
    monsterGroup.userData = bodyBox;
    world.addBody(bodyBox);
}
function createPlayer(data){
    let man=createCube([1,3,1],'#333')
    let header=createCube([0.5,0.5,0.8],'#999')
    header.position.set(0,0.8,0.5)
    let huamn=new THREE.Group()
    huamn.add(man,header)
    huamn.position.set(0,15,220)
    let bodyBox = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(0,15,220),
        shape:new CANNON.Box(new CANNON.Vec3(0.6,1.5,0.6)),
        material:humanMaterial
    });
    huamn.userData=bodyBox
    huamn.name=data.name
    bodyBox.nameid=data.name
    bodyBox.name='monster'
    world.addBody(bodyBox);
    return huamn
}
function createPhysics(){
    world = new CANNON.World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;
    world.defaultContactMaterial.contactEquationStiffness = 1e9;
    world.defaultContactMaterial.contactEquationRelaxation = 4;
    world.gravity.set(0, -29.8, 0);
    world.broadphase = new CANNON.SAPBroadphase(world)
    let groundBody  = new CANNON.Body({ 
        mass: 0, 
        position: new CANNON.Vec3(0,-1,0),
        shape: new CANNON.Box(new CANNON.Vec3(250,1,250)),
        material:planMaterial
    });
    groundBody.position.y=0
    groundBody.quaternion.setFromEuler(0, 0, 0);
    world.addBody(groundBody); 
    cannonDebugger = CannonDebugger(scene, world)
    const contactMaterial = new CANNON.ContactMaterial(humanMaterial, planMaterial, {
        friction:0
    })
    world.addContactMaterial(contactMaterial)
}
const cubeGroup=new THREE.Group()
const sphereGroup=new THREE.Group()
let huamnGroup=new THREE.Group()
const monsterGroup=new THREE.Group()
const cssLabel=new THREE.Group()
let world,qiu,body
let boxMaterial=new CANNON.Material({friction:0.5,restitution:0.3})
let planMaterial=new CANNON.Material()
let humanMaterial=new CANNON.Material({friction:0,restitution:0})
const mine=ref({})
function createScene(){
    createPhysics()
    let plan=createCube([500,2,500],'#ffcc00')
    plan.position.y=-1
    scene.add(plan)
    createBuilding()
    createMonster()
    let man=createCube([1,2,1],'#333')
    let header=createCube([0.5,0.5,0.8],'#999')
    header.position.set(0,0.8,0.5)
    huamnGroup.add(man,header)
    scene.add(huamnGroup)
    let bodyBox = new CANNON.Body({
        mass: 5,
        position: new CANNON.Vec3(0,15,220),
        shape:new CANNON.Box(new CANNON.Vec3(0.5,1,0.5)),
        material:humanMaterial
    });
    huamnGroup.userData=bodyBox
    world.addBody(bodyBox);
    mine.value.name='id_'+(Math.random()*1000).toFixed(0)
    mine.value.blood=100
    mine.value.score=0
    ws.send(JSON.stringify({data:{name:mine.value.name,blood:mine.value.blood,score:mine.value.score,type:'characterMsg'}}))
    let contactNormal = new CANNON.Vec3();
    huamnGroup.userData.addEventListener('collide', (event) => {
        let contact=event.contact
        if(contact.bi.id == huamnGroup.userData.id) 
            contact.ni.negate(contactNormal);
        else
            contactNormal.copy(contact.ni);
        if(contactNormal.dot( new CANNON.Vec3(0,1,0)) > 0.5) 
            jump = true;
    })
    huamnGroup.children[1].add(camera)
    camera.position.set(0,1.5,-0.2)
    let capOs=huamnGroup.position.clone()
    capOs.y+=1
    capOs.z+=1
    camera.lookAt(capOs)
}
function worldRun(){
    cubeGroup.children.forEach(da=>{
        da.position.copy(da.userData.position)
        da.quaternion.copy(da.userData.quaternion);
    })
    huamnGroup.position.copy(huamnGroup.userData.position)
    monsterGroup.position.copy(monsterGroup.userData.position)
    huamnGroup.userData.quaternion.copy(huamnGroup.getWorldQuaternion(new THREE.Quaternion()))
    monsterGroup.userData.quaternion.copy(monsterGroup.getWorldQuaternion(new THREE.Quaternion()))
    let spPos=[]
    sphereGroup.children.forEach(da=>{
        da.position.copy(da.userData.position)
        spPos.push(da.userData.position)
    })
    if(sphereGroup.children.length>0){
        ws.send(JSON.stringify({data:{pos:spPos,type:'bull'}}))
    }
    if(document.getElementById('three')==document.pointerLockElement){
        isgameing.value=true
    }else{
        isgameing.value=false
    }
    ws.send(JSON.stringify({data:{name:mine.value.name,pos:huamnGroup.position,ro:{x:huamnGroup.quaternion.x,y:huamnGroup.quaternion.y,z:huamnGroup.quaternion.z,w:huamnGroup.quaternion.w},type:'human'}}))
}
let playerChange=[]
let playerChangeName=[]
let bullChange=[]
const otherPlayer=new THREE.Group()
const otherSphere=new THREE.Group()
const playerMsg=ref([])
function connect_model(){
    ws.onmessage=da=>{
        let data=JSON.parse(da.data)
        if(data.type=='human'){
            let ids=playerChange.indexOf(data.id)
            if(ids==-1){
                playerChange.push(data.id)
                playerChangeName.push(data.name)
                let player=createPlayer(data)
                otherPlayer.add(player)
            }else{
                let p=data.pos
                p.y+=0.5
                playerChangeName[ids]=data.name
                otherPlayer.children[ids].userData.position.copy(p)
                otherPlayer.children[ids].position.copy(p)
                otherPlayer.children[ids].userData.quaternion.copy(new THREE.Quaternion(data.ro.x,data.ro.y,data.ro.z,data.ro.w))
                otherPlayer.children[ids].quaternion.copy(new THREE.Quaternion(data.ro.x,data.ro.y,data.ro.z,data.ro.w))
            }
        }else if(data.type=='bull'){
            let ids=bullChange.indexOf(data.id)
            if(ids==-1){
                bullChange.push(data.id)
                let bulls=new THREE.Group()
                data.pos.forEach(da=>{
                    let sp=createSphere([0.05,4,4],0x000000)
                    bulls.add(sp)
                })
                otherSphere.add(bulls)
            }else{
                otherSphere.children[ids].children.forEach((da,i)=>{
                    da.position.copy(data.pos[i])
                })
            }
        }else if(data.type=='characterMsg'){
            playerMsg.value=[]
            data.arr.forEach(da=>{
                let s=0
                playerChangeName.forEach((sa,i)=>{
                    if(sa==da.name){
                        s=i
                    }
                })
                if(otherPlayer.children.length>0){
                    if(da.name==otherPlayer.children[s].name){
                        otherPlayer.children[s].userData.blood=da.blood
                        otherPlayer.children[s].userData.score=da.score
                    }
                }
                if(da.name==mine.value.name){
                    mine.value.blood=da.blood
                }
                playerMsg.value.push(da)
            })
        }
    }
}
let animationId=''
function animation(){
    rayDetect()
    world.step(1/60);
    if(huamnGroup.userData){
        humanControl()
    }
    cannonDebugger.update()//显示物理边框
    worldRun()
    renderer.render(scene,camera)
    animationId=window.requestAnimationFrame(animation);
}
let Aa,Dd,Ww,Ss,jump,cam=true,cc=false,co
const speed=25
function humanControl(){
    let pos=new THREE.Vector3()
    huamnGroup.getWorldDirection(pos)
    let player=huamnGroup.userData
    let newpos=new THREE.Vector3()
    if(Aa){
        let tdc=pos.clone()
        let x=tdc.x
        tdc.x=tdc.x*0+tdc.z*1
        tdc.z=tdc.z*0-x*1
        newpos.add(tdc.multiplyScalar(speed/1.5))
    }
    if(Ww){  
        newpos.add(pos.clone().multiplyScalar(speed))
    }
    if(Dd){
        let tdc=pos.clone()
        let x=tdc.x
        tdc.x=tdc.x*0+tdc.z*-1
        tdc.z=tdc.z*0-x*-1
        newpos.add(tdc.multiplyScalar(speed/1.5))
    }
    if(Ss){
        newpos.add(pos.clone().multiplyScalar(-speed))
    }
    player.velocity.x=newpos.x
    player.velocity.z=newpos.z
}
function rayDetect(){
    sphereGroup.children.forEach(da=>{
        let dapos=da.userData.velocity
        let nPos=new THREE.Vector3(dapos.x,dapos.y,dapos.z).normalize()
        let raycaster = new THREE.Raycaster();
        raycaster.set(da.position,nPos)
        let detect=raycaster.intersectObjects(otherPlayer.children)
        let len=Math.sqrt(dapos.x*dapos.x+dapos.y*dapos.y+dapos.z*dapos.z)
        if(detect.length>0){
            if(detect[0].distance-0.05<len/60){
                nPos=nPos.multiplyScalar((detect[0].distance-0.05)*60)
                da.userData.velocity.x=nPos.x
                da.userData.velocity.y=nPos.y
                da.userData.velocity.z=nPos.z
            }
        }
    })
}
const doShot=ref(false)
function eventListener(){
    window.onkeydown=(e)=>{
        if(isgameing.value){
            switch(e.key){
            case 'a':Aa=true;break;
            case 'd':Dd=true;break;
            case 'w':Ww=true;break;
            case 's':Ss=true;break;
            case ' ':
            if(jump){
                huamnGroup.userData.velocity.y=20
            }
            jump=false
            break;
            case 'o':
            cam=!cam
            if(cam){
                huamnGroup.children[1].add(camera)
                camera.position.set(0,1.5,-0.5)
                camera.lookAt(huamnGroup.position.clone())
            }else{
                huamnGroup.children[1].remove(camera)
                camera.position.set(0,102,-50)
                camera.lookAt(huamnGroup.position.clone())
            }
            ;break;
            case 'c':cc=true;document.getElementById('three').requestPointerLock();break;
        }
        } 
    }
    window.onkeyup=(e)=>{
        switch(e.key){
            case 'a':Aa=false;break;
            case 'd':Dd=false;break;
            case 'w':Ww=false;break;
            case 's':Ss=false;break;
        }
    }
    document.getElementById('three').onclick=(e)=>{
        if(isgameing.value){
            let sp=createSphere([0.05,4,4],'#ffcc00')
            let humanpos=huamnGroup.position.clone()
            sp.position.copy(humanpos)
            sp.castShadow=true
            let ball = new CANNON.Body({
                mass: 0.1,
                shape: new CANNON.Sphere(0.05),
                material:boxMaterial
            });
            let pos=new THREE.Vector3()
            camera.getWorldDirection(pos)
            humanpos.y+=2.3
            ball.position.copy(humanpos)
            ball.velocity.copy(pos.multiplyScalar(350))
            sp.userData=ball
            sphereGroup.add(sp)
            world.addBody(ball)
            ball.name='ball'
            ball.addEventListener('collide',(e)=>{
                if(e.body.name=='monster'){
                    console.log(e.body)
                    let daPos=e.target.position.clone()
                    daPos=new THREE.Vector3(daPos.x, daPos.y, daPos.z)
                    var canvas = document.createElement('canvas');
                    canvas.width=50
                    canvas.height=50
                    var ctx = canvas.getContext('2d');
                    ctx.font = "bold 20px 微软雅黑";
                    ctx.fillStyle='rgba(255,255,255,1)'
                    ctx.strokeStyle='rgba(255,255,255,1)'
                    ctx.fillText('1', 10, 40);
                    ctx.fill();
                    let texture = new THREE.CanvasTexture(canvas);
                    texture.needsUpdate = true;
                    const material = new THREE.SpriteMaterial( { map: texture } );
                    const sprite = new THREE.Sprite( material );
                    mine.value.score+=1
                    e.body.blood-=1
                    ws.send(JSON.stringify({data:{name:mine.value.name,blood:mine.value.blood,score:mine.value.score,type:'characterMsg'}}))
                    ws.send(JSON.stringify({data:{name:e.body.nameid,blood:e.body.blood,score:e.body.score,type:'characterMsg'}}))
                    daPos.add(new THREE.Vector3(e.target.velocity.x,e.target.velocity.y,e.target.velocity.z).normalize().multiplyScalar(-1))
                    sprite.position.copy(daPos)
                    cssLabel.add( sprite );
                    
                    doShot.value=true
                    setTimeout(()=>{
                        doShot.value=false
                    },100)
                    setTimeout(()=>{
                        cssLabel.remove(sprite)
                        sprite.material.dispose()
                        sprite.geometry.dispose()
                    },2000)
                }
                setTimeout(()=>{
                    world.removeBody(ball)
                    sphereGroup.remove(sp)
                    sp.material.dispose()
                    sp.geometry.dispose()
                })
            })
            setTimeout(()=>{
                world.removeBody(ball)
                sphereGroup.remove(sp)
                sp.material.dispose()
                sp.geometry.dispose()
            },10000)
        }
    }
}
document.addEventListener('mousemove', (event) => {
    if(cam&&isgameing.value){
        huamnGroup.rotation.y -= event.movementX / 600;
        camera.rotation.x += event.movementY / 600;
        let angleMax=Math.PI*(45/180)-Math.PI
        let angleMin=Math.PI*(-85/180)-Math.PI
        if (camera.rotation.x < angleMin) {
            camera.rotation.x = angleMin;
        }
        if (camera.rotation.x > angleMax) {
            camera.rotation.x = angleMax
        };
    } 
});

</script>
<style lang="scss" scoped>
.Main{
    width: 100vw;
    height: 100vh;
}
.load{
    z-index: 999;
    position: absolute;
    background-color: #fc09;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    >div{
        width: 300px;
        height: 40px;
        border-radius: 25px;
        border: 2px solid #fff;
        background-color: #fff9;
        overflow: hidden;
        >div{
            height: 100%;
            background-color: #fa3;
        }
    }
    .btn{
        margin-top: 185px;
        width: 350px;
        height: 50px;
        border-radius: 15px;
        text-align: center;
        line-height: 50px;
        font-size: 20px;
        background: #fa3;
        border-radius: 2px solid #fff;
        color:#000;
        cursor: pointer;
    }
}
.zunxin{
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    >div{
        width: 3px;
        height: 3px;
        border-radius: 3px;
        background-color: #0f0;
    }
    .shot{
        background-color: #f00;
    }
}
.ui{
    position: absolute;
    width: 100%;
    height: 100%;
    .mine{
        position: absolute;
        min-width: 240px;
        height: 50px;
        top: 0px;
        left: 10px;
    }
    .m-sc{
        margin-left: 30px;
        color:#fff
    }
    .players{
        position: absolute;
        min-width: 240px;
        height: 550px;
        top: 20px;
        right: 20px;
    }
    .playerMsg{
        display: flex;
        justify-content: center;
        align-items: center;
        >span{
            font-size: 16px;
            width: 80px;
            text-align: right;
            color: #fff;
            text-shadow: #000;
            overflow: hidden;
            text-overflow: ellipsis;
            text-wrap:nowrap;
            margin-right: 5px;
        }
        .score{
            text-align: left;
            margin-left: 5px;
            overflow:visible;
        }
        >div{
            width: 160px;
            height: 10px;
            border-radius: 25px;
            border: 1px solid #fff;
            overflow: hidden;
            background-color: rgb(105, 47, 47);
            >div{
                height: 100%;
                background-color: #f00;
            }
        }
    }
}

</style>