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
        <div class="zunxin">
            <div></div>
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
    init()
    createScene()
    animotion()
})
onUnmounted(()=>{
  window.cancelAnimationFrame(animationId)
})
const loading = ref(0)
const isgameing=ref(false)
function startGame(){
    isgameing.value = true
    document.getElementById('three').requestPointerLock()
    eventListener()
}
function init(){
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
    renderer = new THREE.WebGLRenderer({
        antialias:true,
        pixelRatio:'devicePixelRatio',
        precision:'mediump'
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
    scene.add(huamnGroup)
    scene.add(monsterGroup)
    scene.add(cssLabel)
    // const helper = new THREE.CameraHelper( light.shadow.camera );
    // scene.add( helper );
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
    for(let i=0;i<50;i++){
        let scale=[Math.random()*50,Math.random()*50,Math.random()*50]
        let pos=[Math.random()*300-50,Math.random()*50+50,Math.random()*300-50]
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
        mass: 5,
        position: new CANNON.Vec3(0,15,0),
        shape:new CANNON.Sphere(1.3),
        material:humanMaterial
    });
    bodyBox.name='monster'
    monsterGroup.userData = bodyBox;
    world.addBody(bodyBox);
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
        shape: new CANNON.Plane(),
        material:planMaterial
    });
    groundBody.position.y=0
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody); 
    cannonDebugger = CannonDebugger(scene, world)
    const contactMaterial = new CANNON.ContactMaterial(humanMaterial, boxMaterial, {
        friction:1
    })
    world.addContactMaterial(contactMaterial)
}
const cubeGroup=new THREE.Group()
const sphereGroup=new THREE.Group()
const huamnGroup=new THREE.Group()
const monsterGroup=new THREE.Group()
const cssLabel=new THREE.Group()
let world,qiu,body
let boxMaterial=new CANNON.Material({friction:0.5,restitution:0.3})
let planMaterial=new CANNON.Material()
let humanMaterial=new CANNON.Material({friction:0.5,restitution:0.3})
function createScene(){
    createPhysics()
    let plan=createCube([500,2,500],'#ffcc00')
    plan.position.y=-1
    createBuilding()
    createMonster()
    let man=createCube([1,2,1],'#333')
    let header=createCube([0.5,0.5,0.8],'#999')
    header.position.set(0,0.8,0.5)
    huamnGroup.add(man,header)
    huamnGroup.position.set(0,15,220)
    let bodyBox = new CANNON.Body({
        mass: 5,
        position: new CANNON.Vec3(0,15,220),
        shape:new CANNON.Sphere(1.3),
        material:humanMaterial
    });
    huamnGroup.userData=bodyBox
    world.addBody(bodyBox);
    scene.add(plan)
    let contactNormal = new CANNON.Vec3();
    huamnGroup.userData.addEventListener('collide', (event) => {
        // co=true
        let contact=event.contact
        if(contact.bi.id == huamnGroup.userData.id) 
            contact.ni.negate(contactNormal);
        else
            contactNormal.copy(contact.ni);
        if(contactNormal.dot( new CANNON.Vec3(0,1,0)) > 0.5) 
            jump = true;
    })
    huamnGroup.children[1].add(camera)
    camera.position.set(0,2,-1)
    camera.lookAt(huamnGroup.position.clone())
}
function worldRun(){
    cubeGroup.children.forEach(da=>{
        da.position.copy(da.userData.position)
        da.quaternion.copy(da.userData.quaternion);
    })
    huamnGroup.position.copy(huamnGroup.userData.position)
    monsterGroup.position.copy(monsterGroup.userData.position)
    // huamnGroup.userData.quaternion.copy(huamnGroup.getWorldQuaternion(new THREE.Quaternion()))
    // huamnGroup.quaternion.copy(huamnGroup.userData.quaternion);
    sphereGroup.children.forEach(da=>{
        da.position.copy(da.userData.position)
        da.quaternion.copy(da.userData.quaternion);
    })
    if(document.getElementById('three')==document.pointerLockElement){
        isgameing.value=true
    }else{
        isgameing.value=false
    }
}
let animationId=''
function animotion(){
    world.step(1/60);
    if(huamnGroup.userData){
        humanControl()
    }
    rayDetect()
    cannonDebugger.update()
    worldRun()
    renderer.render(scene,camera)
    animationId=window.requestAnimationFrame(animotion);
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
    
}
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
                camera.position.set(0,2,-1)
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
            let sp=createSphere([0.1,4,4],'#ffcc00')
            let humanpos=huamnGroup.position.clone()
            sp.position.copy(humanpos)
            sp.castShadow=true
            let ball = new CANNON.Body({
                mass: 0.1,
                shape: new CANNON.Sphere(0.2),
                material:boxMaterial
            });
            let pos=new THREE.Vector3()
            camera.getWorldDirection(pos)
            humanpos.y+=2.8
            ball.position.copy(humanpos)
            ball.velocity.copy(pos.multiplyScalar(150))
            sp.userData=ball
            sphereGroup.add(sp)
            world.addBody(ball)
            ball.addEventListener('collide',(e)=>{
                if(e.body.name=='monster'){
                    let daPos=e.target.position.clone()
                    var canvas = document.createElement('canvas');
                    canvas.width=50
                    canvas.height=50
                    var ctx = canvas.getContext('2d');
                    ctx.font = "bold 20px 微软雅黑";
                    ctx.fillStyle='rgba(255,255,255,1)'
                    ctx.strokeStyle='rgba(255,255,255,1)'
                    ctx.fillText('23', 10, 40);
                    ctx.fill();
                    let texture = new THREE.CanvasTexture(canvas);
                    texture.needsUpdate = true;
                    const material = new THREE.SpriteMaterial( { map: texture } );
                    const sprite = new THREE.Sprite( material );
                    daPos.y+=1
                    sprite.position.copy(daPos)
                    cssLabel.add( sprite );
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
        let angleMax=Math.PI*(35/180)-Math.PI
        let angleMin=Math.PI*(-65/180)-Math.PI
        if (camera.rotation.x < angleMin) {
            camera.rotation.x = angleMin;
        }
        if (camera.rotation.x > angleMax) {
            camera.rotation.x = angleMax
        };
    } 
});
// window.addEventListener( 'pointermove', onPointerMove );

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
        width: 5px;
        height: 5px;
        border-radius: 3px;
        background-color: #f00;
    }
}

</style>