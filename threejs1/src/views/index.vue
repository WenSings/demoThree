<template>
    <div class="Main">
        <div v-show="loading<100" class="load">
            <div>
                <div :style="'width:'+loading+'%'"></div>
            </div>
        </div>
        <div id="three"></div>
    </div>
</template>
<script setup>
import {onMounted,ref,onUnmounted} from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { PointerLockControls  } from 'three/addons/controls/PointerLockControls.js';
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
    camera.position.set(150,80,0)
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
    const light = new THREE.PointLight(  0xffffff, 10000, 0 );
    light.shadow.mapSize.width = 1512; // default
    light.shadow.mapSize.height = 1512; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default
    light.castShadow = true;
    light.position.set(250,150,0)
    scene.add( light );
    scene.add(cubeGroup)
    scene.add(sphereGroup)
    scene.add(huamnGroup)
    // const helper = new THREE.CameraHelper( light.shadow.camera );
    // scene.add( helper );
    // drawMap()
}
function drawMap(){
    let pg=new THREE.PlaneGeometry(5,4,519,410)
    let texture1 = new THREE.TextureLoader().load( "/image/color_texture.jpg" );
    let texture2 = new THREE.TextureLoader().load( "/image/alph_texture.jpg" );
    let texture3 = new THREE.TextureLoader().load( "/image/de_texture.jpg" );
    let mat={
        map:texture1,
        side:THREE.DoubleSide,
        transparent: true,
        alphaMap:texture2,
        displacementMap:texture3,
        displacementScale: 0.15,
    }
    let mesh=new THREE.Mesh(pg,new THREE.MeshStandardMaterial(mat)) 
    mesh.position.set(0,5,240)
    mesh.rotation.set(0,Math.PI,0)
    scene.add( mesh )
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
        });//创建一个质量为1kg，位置为（x,20,z），形状为halfSize为1,1,1的正方形刚体，材质中摩擦系数为0.1，弹性系数为0。
        c.userData = bodyBox;//给box的userData属性添加刚体数据
        world.addBody(bodyBox);//在物理世界中添加该刚体
        cubeGroup.add(c)
    }
}
function createPhysics(){
    world = new CANNON.World();
    // 设置物理世界重力加速度
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;
    world.gravity.set(0, -9.8, 0);
    world.broadphase = new CANNON.SAPBroadphase(world)
    // world.allowSleep = true
    // 物理地面
    let groundBody  = new CANNON.Body({ //创建一个刚体（物理世界的刚体数据）
        mass: 0, //刚体的质量，这里单位为kg
        shape: new CANNON.Plane(), 
        material: boxMaterial //材质数据，里面规定了摩擦系数和弹性系数
    });
    groundBody.position.y=0
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody); //物理世界添加地面刚体
    cannonDebugger = CannonDebugger(scene, world)
    
}
const cubeGroup=new THREE.Group()
const sphereGroup=new THREE.Group()
const huamnGroup=new THREE.Group()
let world,qiu,body
let boxMaterial=new CANNON.Material()
let humanMaterial=new CANNON.Material()
function createScene(){
    createPhysics()
    let plan=createCube([500,2,500],'#ffcc00')
    plan.position.y=-1
    createBuilding()
    let man=createCube([1,2,1],'#333')
    let header=createCube([0.5,0.5,0.8],'#999')
    header.position.set(0,0.8,0.5)
    huamnGroup.add(man,header)
    huamnGroup.position.set(0,15,220)
    let bodyBox = new CANNON.Body({
        mass: 5,
        position: new CANNON.Vec3(0,15,220),
        shape: new CANNON.Sphere(1.3),
        material: humanMaterial
    });
    var physicsContactMaterial = new CANNON.ContactMaterial(boxMaterial,humanMaterial,{
        restitution:0,
        friction:1,
    });
    world.addContactMaterial(physicsContactMaterial);
    huamnGroup.userData=bodyBox
    world.addBody(bodyBox);//在物理世界中添加该刚体
    scene.add(plan)
    console.log(bodyBox)
    let contactNormal = new CANNON.Vec3();
    huamnGroup.userData.addEventListener('collide', (event) => {
        // co=true
        console.log(event.contact)
        let contact=event.contact
        if(contact.bi.id == huamnGroup.userData.id) 
            contact.ni.negate(contactNormal);
        else
            contactNormal.copy(contact.ni);
    })
    huamnGroup.children[1].add(camera)
    camera.position.set(0,2,-5)
    camera.lookAt(huamnGroup.position.clone())
}
function worldRun(){
    cubeGroup.children.forEach(da=>{
        da.position.copy(da.userData.position)
        da.quaternion.copy(da.userData.quaternion);
    })
    huamnGroup.position.copy(huamnGroup.userData.position)
    huamnGroup.userData.quaternion.copy(huamnGroup.getWorldQuaternion(new THREE.Quaternion()))
    // huamnGroup.quaternion.copy(huamnGroup.userData.quaternion);
    
}
let animationId=''
function animotion(){
    world.step(1/60);
    if(huamnGroup.userData){
        humanControl()
    }
    cannonDebugger.update()
    worldRun()
    renderer.render(scene,camera)
    animationId=window.requestAnimationFrame(animotion);
}
let Aa,Dd,Ww,Ss,cam=true,cc=false,co
const speed=0.3
function humanControl(){
    let pos=new THREE.Vector3()
    huamnGroup.getWorldDirection(pos)
    let player=huamnGroup.userData
    
    if(Aa&&!co){
        let tdc=pos.clone()
        let x=tdc.x
        tdc.x=tdc.x*0+tdc.z*1
        tdc.z=tdc.z*0-x*1
        move(player,tdc.multiplyScalar(speed))
    }
    if(Dd&&!co){
        let tdc=pos.clone()
        let x=tdc.x
        tdc.x=tdc.x*0+tdc.z*-1
        tdc.z=tdc.z*0-x*-1
        move(player,tdc.multiplyScalar(speed))
    }
    if(Ww&&!co){  
        move(player,pos.clone().multiplyScalar(speed))
    }
    if(Ss&&!co){
        move(player,pos.clone().multiplyScalar(-speed))
    }

}
function move(obj,pos){
    let p=new THREE.Vector3()
    p.copy(obj.position)
    p.add(pos)
    obj.position.copy(p)
}
window.onkeydown=(e)=>{
    switch(e.key){
        case 'a':Aa=true;break;
        case 'd':Dd=true;break;
        case 'w':Ww=true;break;
        case 's':Ss=true;break;
        case 'o':
        cam=!cam
        if(cam){
            huamnGroup.children[1].add(camera)
            camera.position.set(0,2,-5)
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
window.onkeyup=(e)=>{
    switch(e.key){
        case 'a':Aa=false;break;
        case 'd':Dd=false;break;
        case 'w':Ww=false;break;
        case 's':Ss=false;break;
    }
}
document.addEventListener('mousemove', (event) => {
    if(cam&&document.getElementById('three')==document.pointerLockElement){
        huamnGroup.rotation.y -= event.movementX / 600;
        camera.rotation.x += event.movementY / 600;
        let angleMax=Math.PI*(25/180)-Math.PI
        let angleMin=Math.PI*(-45/180)-Math.PI
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
    background-color: #fc0;
    width: 100%;
    height: 100%;
    display: flex;
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
}
</style>