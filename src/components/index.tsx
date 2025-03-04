import { createTheme, ThemeProvider } from "@mui/material"
import { VRM, VRMSchema } from "@pixiv/three-vrm"
import React, { Suspense, useState, useEffect, Fragment } from "react"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { sceneService } from "../services"
import DownloadCharacter from "./Download"
import LoadingOverlayCircularStatic from "./LoadingOverlay"
import Scene from "./Scene"
import { AnimationMixer } from "three";

interface Avatar{
  neck:{},
  head:{},
  chest:{},
  body:{},
  legs:{},
  hand:{},
  foot:{},
  waist:{}
}

export default function CharacterEditor(props: any) {
  // State Hooks For Character Editor ( Base ) //
  // ---------- //
  // Charecter Name State Hook ( Note: this state will also update the name over the 3D model. )
  // const [characterName, setCharacterName] =
  //   useState<string>("Character Name");
  // Categories State and Loaded Hooks
  // const [categories, setCategories] = useState([]);
  // const [categoriesLoaded, setCategoriesLoaded] =
  //   useState<boolean>(false);
  // TODO: Where is setNodes
  // const [nodes, setNodes] = useState<object>(Object);
  // const [materials, setMaterials] = useState<object>(Object);
  // const [animations, setAnimations] = useState<object>(Object);
  // const [body, setBody] = useState<any>();

  const { theme, templates, mintPopup } = props
  // Selected category State Hook
  const [category, setCategory] = useState("color")
  // 3D Model Content State Hooks ( Scene, Nodes, Materials, Animations e.t.c ) //
  const [model, setModel] = useState<object>(Object)

  const [scene, setScene] = useState<object>(Object)
  // States Hooks used in template editor //
  const [templateInfo, setTemplateInfo] = useState({ file: null, format: null, animation: null })

  const [downloadPopup, setDownloadPopup] = useState<boolean>(false)
  const [template, setTemplate] = useState<number>(1)
  const [loadingModelProgress, setLoadingModelProgress] = useState<number>(0)
  const [ avatar,setAvatar] = useState<Avatar>({
    neck:{},
    head:{},
    chest:{},
    body:{},
    legs:{},
    hand:{},
    foot:{},
    waist:{}
  })
  const [loadingModel, setLoadingModel] = useState<boolean>(false)

  const defaultTheme = createTheme({
    palette: {
      mode: "dark",
      primary: {
        main: "#de2a5e",
      },
    },
  })

  useEffect(() => {
    if(avatar){
      sceneService.setTraits(avatar);
    }
  }, [avatar])

  useEffect(() => {
    if(model)
    sceneService.setModel(model);
  }, [model])

  useEffect(() => {
    let timer, modelMixer;
    if (templateInfo.file && templateInfo.format) {
      setLoadingModel(true)
      const loader = new GLTFLoader()
      loader
        .loadAsync(templateInfo.file, (e) => {
          setLoadingModelProgress((e.loaded * 100) / e.total)
        })
        .then((gltf) => {
          const vrm = gltf;
          // VRM.from(gltf).then((vrm) => {
            vrm.scene.traverse((o) => {
              o.frustumCulled = false
            })
            // vrm.humanoid.getBoneNode(
            //   VRMSchema.HumanoidBoneName.Hips,
            // ).rotation.y = Math.PI
            setLoadingModel(false)
            setScene(vrm.scene)
            setModel(vrm)
          // })
          return vrm;
        }).then((modelGltf) => {
          loader.loadAsync(templateInfo.animation).then((animGltf) => {
            // modelGltf and animGltf are both gltf files
            // get the Idle animation from the model in animGltf
            // and apply the Idle animation to modelGltf
            modelMixer = new AnimationMixer(modelGltf.scene);
            (window as any).modelMixers = [];
            (window as any).modelMixers.push(modelMixer);
            console.log("Loading Animation")
            const idleAnimation = animGltf.animations[0]
            console.log("idleAnimation is", idleAnimation);
            timer = setInterval(() => {
              (window as any).modelMixers.forEach((mixer) => {
                mixer.update(1/30);
              });
              }, 1000/30);
            modelMixer.clipAction(idleAnimation).play();
            console.log("Playing on avatar", idleAnimation);
          })
        });
        return () => {
          clearInterval(timer);
          modelMixer = null;
        }
    }
  }, [templateInfo.file])

  return (
    <Suspense fallback="loading...">
      <ThemeProvider theme={theme ?? defaultTheme}>
        {templateInfo && (
          <Fragment>
            {loadingModel && (
              <LoadingOverlayCircularStatic
                loadingModelProgress={loadingModelProgress}
              />
            )}
            <DownloadCharacter
              scene={scene}
              templateInfo={templateInfo}
              model={model}
              downloadPopup={downloadPopup}
              setDownloadPopup={setDownloadPopup}
            />
            <Scene
              wrapClass="generator"
              templates={templates}
              scene={scene}
              downloadPopup={downloadPopup}
              mintPopup={mintPopup}
              category={category}
              setCategory={setCategory}
              avatar = {avatar}
              setAvatar={setAvatar}
              setTemplate={setTemplate}
              template={template}
              setTemplateInfo={setTemplateInfo}
              templateInfo={templateInfo}
            />
          </Fragment>
        )}
      </ThemeProvider>
    </Suspense>
  )
}
