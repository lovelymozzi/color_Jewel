// Auto-generated contract module for file:// fallback.

export const COLOR_JEWEL_CONTRACT = {
  "contractVersion": 1,
  "sceneId": "color-jewel",
  "sceneName": "Color_Jewel",
  "canvas": {
    "width": 390,
    "height": 844
  },
  "viewport": {
    "width": 390,
    "height": 844
  },
  "background": {
    "type": "none",
    "color": "#ffffff",
    "color2": "rgba(71,178,255,0.35)",
    "gradientAngle": 180,
    "imagePath": "assets/16_9.png",
    "tileSize": 64,
    "stretchMode": "cover",
    "scrollEnabled": false,
    "scrollDirection": "right",
    "scrollDuration": 4
  },
  "groups": [
    {
      "name": "Button",
      "layerStableIds": [
        "level-node-19",
        "level-node-18",
        "level-node-57",
        "level-node-4"
      ]
    },
    {
      "name": "sound_off",
      "layerStableIds": []
    }
  ],
  "sceneAnimations": [],
  "layers": [
    {
      "stableId": "level-node-19",
      "layerType": "component",
      "displayName": "Level Node",
      "x": 296,
      "y": 689,
      "scale": 1.35,
      "zIndex": 1,
      "visual": {
        "model": {
          "shape": {
            "type": "rectangle",
            "width": 51,
            "height": 51,
            "radius": 20,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "linear-gradient",
            "color1": "#fef1b3",
            "color2": "#fedf88",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 2,
            "color": "#f4d273"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": true,
              "size": 3,
              "color": "#eec266"
            },
            {
              "type": "outer",
              "enabled": true,
              "x": 0,
              "y": 7,
              "blur": 4,
              "color": "#000000",
              "opacity": 13
            },
            {
              "type": "inner",
              "enabled": true,
              "x": 0,
              "y": 2,
              "blur": 0,
              "color": "#ffffb3",
              "opacity": 100
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        },
        "images": [
          {
            "exportPath": "assets/PictoIcon_Setting_1.webp",
            "width": 32,
            "height": 32,
            "offsetX": 0,
            "offsetY": 0,
            "zIndex": 3
          }
        ]
      },
      "effects": [
        {
          "type": "press",
          "source": {
            "provider": "internal",
            "name": "press"
          },
          "enabled": true,
          "target": "self",
          "trigger": "pointer",
          "params": {
            "transitionMs": 100,
            "brightness": 95,
            "scale": 100,
            "useDepthOffset": true
          }
        }
      ]
    },
    {
      "stableId": "time-display-56",
      "layerType": "component",
      "displayName": "Pocket Area",
      "x": 28,
      "y": 595,
      "zIndex": 2,
      "visual": {
        "model": {
          "shape": {
            "type": "rectangle",
            "width": 335,
            "height": 71,
            "radius": 12,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#ffebbe",
            "color2": "#2558a0",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 2,
            "color": "#f8e4b8"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": true,
              "size": 3,
              "color": "#e5c57b"
            },
            {
              "type": "outer",
              "enabled": true,
              "x": 0,
              "y": 7,
              "blur": 4,
              "color": "#000000",
              "opacity": 13
            },
            {
              "type": "inner",
              "enabled": true,
              "x": 0,
              "y": 3,
              "blur": 0,
              "color": "#fefcee",
              "opacity": 100
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      }
    },
    {
      "stableId": "level-node-18",
      "layerType": "component",
      "displayName": "Level Node",
      "x": 207,
      "y": 689,
      "scale": 1.35,
      "zIndex": 3,
      "visual": {
        "model": {
          "shape": {
            "type": "rectangle",
            "width": 51,
            "height": 51,
            "radius": 20,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "linear-gradient",
            "color1": "#fefae8",
            "color2": "#fdf1d8",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 2,
            "color": "#ede0cc"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": true,
              "size": 3,
              "color": "#e0d0ab"
            },
            {
              "type": "outer",
              "enabled": true,
              "x": 0,
              "y": 7,
              "blur": 4,
              "color": "#000000",
              "opacity": 13
            },
            {
              "type": "inner",
              "enabled": true,
              "x": 0,
              "y": 2,
              "blur": 0,
              "color": "#ffffff",
              "opacity": 100
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        },
        "images": [
          {
            "exportPath": "assets/rock.png",
            "width": 35,
            "height": 35,
            "offsetX": 0,
            "offsetY": 0,
            "zIndex": 2,
            "style": {
              "shadow": {
                "enabled": true,
                "x": 0,
                "y": 3,
                "blur": 0,
                "color": "#000000",
                "opacity": 15
              },
              "tint": {
                "mode": "off",
                "color": "#ff3b30",
                "strength": 100
              }
            }
          }
        ]
      },
      "effects": [
        {
          "type": "press",
          "source": {
            "provider": "internal",
            "name": "press"
          },
          "enabled": true,
          "target": "self",
          "trigger": "pointer",
          "params": {
            "transitionMs": 100,
            "brightness": 95,
            "scale": 100,
            "useDepthOffset": true
          }
        }
      ]
    },
    {
      "stableId": "level-node-57",
      "layerType": "component",
      "displayName": "Level Node",
      "x": 119,
      "y": 687,
      "scale": 1.35,
      "zIndex": 4,
      "visual": {
        "model": {
          "shape": {
            "type": "rectangle",
            "width": 51,
            "height": 51,
            "radius": 20,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "linear-gradient",
            "color1": "#fef2b6",
            "color2": "#fee18b",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 2,
            "color": "#f4d273"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": true,
              "size": 3,
              "color": "#eec266"
            },
            {
              "type": "outer",
              "enabled": true,
              "x": 0,
              "y": 7,
              "blur": 4,
              "color": "#000000",
              "opacity": 13
            },
            {
              "type": "inner",
              "enabled": true,
              "x": 0,
              "y": 2,
              "blur": 0,
              "color": "#ffffb3",
              "opacity": 100
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        },
        "images": [
          {
            "exportPath": "assets/clean.png",
            "width": 35,
            "height": 35,
            "offsetX": 0,
            "offsetY": 0,
            "zIndex": 1,
            "style": {
              "shadow": {
                "enabled": true,
                "x": 0,
                "y": 3,
                "blur": 0,
                "color": "#000000",
                "opacity": 15
              },
              "tint": {
                "mode": "off",
                "color": "#ff3b30",
                "strength": 100
              }
            }
          },
          {
            "exportPath": "assets/circle1.png",
            "width": 22,
            "height": 22,
            "offsetX": 14,
            "offsetY": 19,
            "zIndex": 2
          }
        ]
      },
      "effects": [
        {
          "type": "press",
          "source": {
            "provider": "internal",
            "name": "press"
          },
          "enabled": true,
          "target": "self",
          "trigger": "pointer",
          "params": {
            "transitionMs": 100,
            "brightness": 95,
            "scale": 100,
            "useDepthOffset": true
          }
        }
      ],
      "texts": [
        {
          "slotIndex": 0,
          "staticContent": "2",
          "bindingKey": "item.clean",
          "fontSize": 16,
          "fontWeight": "bold",
          "fontFamily": "\"Lilita One\", cursive",
          "color": "#ffffff",
          "offsetX": 14,
          "offsetY": 19,
          "zIndex": 3,
          "style": {
            "stroke": {
              "width": 0,
              "color": "#ffffff"
            },
            "depth": {
              "size": 0,
              "color": "#000000"
            },
            "shadow": {
              "x": 0,
              "y": 1,
              "blur": 2,
              "color": "#000000",
              "opacity": 40
            }
          }
        }
      ],
      "events": [
        {
          "trigger": "click",
          "eventName": "item.wand"
        }
      ]
    },
    {
      "stableId": "level-node-4",
      "layerType": "component",
      "displayName": "Level Node",
      "x": 30,
      "y": 689,
      "scale": 1.35,
      "zIndex": 5,
      "visual": {
        "model": {
          "shape": {
            "type": "rectangle",
            "width": 51,
            "height": 51,
            "radius": 20,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "linear-gradient",
            "color1": "#fef4b9",
            "color2": "#fedf87",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 2,
            "color": "#f4d273"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": true,
              "size": 3,
              "color": "#eec266"
            },
            {
              "type": "outer",
              "enabled": true,
              "x": 0,
              "y": 7,
              "blur": 4,
              "color": "#000000",
              "opacity": 13
            },
            {
              "type": "inner",
              "enabled": true,
              "x": 0,
              "y": 2,
              "blur": 0,
              "color": "#ffffb3",
              "opacity": 100
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        },
        "images": [
          {
            "exportPath": "assets/magic.png",
            "width": 32,
            "height": 32,
            "offsetX": 0,
            "offsetY": 0,
            "zIndex": 1,
            "style": {
              "shadow": {
                "enabled": true,
                "x": 0,
                "y": 3,
                "blur": 0,
                "color": "#000000",
                "opacity": 15
              },
              "tint": {
                "mode": "off",
                "color": "#ff3b30",
                "strength": 100
              }
            }
          },
          {
            "exportPath": "assets/circle1.png",
            "width": 22,
            "height": 22,
            "offsetX": 19,
            "offsetY": 17,
            "zIndex": 2
          }
        ]
      },
      "effects": [
        {
          "type": "press",
          "source": {
            "provider": "internal",
            "name": "press"
          },
          "enabled": true,
          "target": "self",
          "trigger": "pointer",
          "params": {
            "transitionMs": 100,
            "brightness": 95,
            "scale": 100,
            "useDepthOffset": true
          }
        }
      ],
      "texts": [
        {
          "slotIndex": 0,
          "staticContent": "2",
          "bindingKey": "item.wand",
          "fontSize": 16,
          "fontWeight": "bold",
          "fontFamily": "\"Lilita One\", cursive",
          "color": "#ffffff",
          "offsetX": 19,
          "offsetY": 17,
          "zIndex": 3,
          "style": {
            "stroke": {
              "width": 0,
              "color": "#ffffff"
            },
            "depth": {
              "size": 0,
              "color": "#000000"
            },
            "shadow": {
              "x": 0,
              "y": 1,
              "blur": 2,
              "color": "#000000",
              "opacity": 40
            }
          }
        }
      ],
      "events": [
        {
          "trigger": "click",
          "eventName": "item.wand"
        }
      ]
    },
    {
      "stableId": "shape-ellipse-169",
      "layerType": "component",
      "displayName": "타원",
      "x": 76,
      "y": 733,
      "zIndex": 6,
      "visual": {
        "model": {
          "shape": {
            "type": "circle",
            "width": 30,
            "height": 23,
            "radius": 12,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#f97f8a",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": false,
              "size": 0,
              "color": "#1e4a80"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        },
        "images": [
          {
            "exportPath": "assets/PictoIcon_Player_Play.Png",
            "width": 12,
            "height": 12,
            "offsetX": 2,
            "offsetY": 0,
            "zIndex": 2
          }
        ]
      }
    }
  ]
};

export const SETTING_CONTRACT = {
  "contractVersion": 1,
  "sceneId": "setting",
  "sceneName": "setting",
  "canvas": {
    "width": 390,
    "height": 844
  },
  "viewport": {
    "width": 390,
    "height": 844
  },
  "background": {
    "type": "none",
    "color": "rgba(153,153,153,0.15)",
    "color2": "#0e4a8c",
    "gradientAngle": 180,
    "imagePath": "",
    "tileSize": 64,
    "stretchMode": "cover",
    "scrollEnabled": false,
    "scrollDirection": "right",
    "scrollDuration": 4
  },
  "groups": [
    {
      "name": "sound_on",
      "layerStableIds": []
    },
    {
      "name": "bg",
      "layerStableIds": [
        "shape-rect-112",
        "-111",
        "-113",
        "pause-119"
      ]
    },
    {
      "name": "sound_off",
      "layerStableIds": []
    },
    {
      "name": "bgm_on",
      "layerStableIds": []
    },
    {
      "name": "bgm_off",
      "layerStableIds": []
    },
    {
      "name": "haptics_off",
      "layerStableIds": []
    },
    {
      "name": "haptics_on",
      "layerStableIds": []
    },
    {
      "name": "bgm_on",
      "layerStableIds": [
        "-254",
        "jewel-soket-png-256",
        "icon-whiteicon-check-s-png-258"
      ]
    },
    {
      "name": "off",
      "layerStableIds": []
    },
    {
      "name": "Group",
      "layerStableIds": []
    },
    {
      "name": "on",
      "layerStableIds": []
    },
    {
      "name": "bgm_off",
      "layerStableIds": [
        "shape-pill-274",
        "jewel-soket-png-275",
        "icon-whiteicon-close-png-277"
      ]
    },
    {
      "name": "sfx_on",
      "layerStableIds": []
    },
    {
      "name": "sfx_on",
      "layerStableIds": []
    },
    {
      "name": "sfx_on",
      "layerStableIds": [
        "-304",
        "jewel-soket-png-305",
        "icon-whiteicon-check-s-png-306"
      ]
    },
    {
      "name": "sfx_off",
      "layerStableIds": [
        "shape-pill-307",
        "jewel-soket-png-308",
        "icon-whiteicon-close-png-309"
      ]
    },
    {
      "name": "vibration_on",
      "layerStableIds": [
        "-310",
        "jewel-soket-png-311",
        "icon-whiteicon-check-s-png-312"
      ]
    },
    {
      "name": "vibration_off",
      "layerStableIds": [
        "shape-pill-313",
        "jewel-soket-png-314",
        "icon-whiteicon-close-png-315"
      ]
    }
  ],
  "fxGroups": [],
  "sceneAnimations": [],
  "layers": [
    {
      "stableId": "shape-rect-112",
      "layerType": "component",
      "displayName": "사각형",
      "x": 67,
      "y": 58,
      "zIndex": 1,
      "visual": {
        "model": {
          "shape": {
            "type": "rectangle",
            "width": 380,
            "height": 786,
            "radius": 0,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#fef1b3",
            "color2": "#ecd38e",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": false,
              "size": 0,
              "color": "#1e4a80"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      }
    },
    {
      "stableId": "-111",
      "layerType": "component",
      "displayName": "원",
      "x": 67,
      "y": 0,
      "zIndex": 2,
      "visual": {
        "model": {
          "shape": {
            "type": "circle",
            "width": 116,
            "height": 111,
            "radius": 12,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#fef1b3",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": false,
              "size": 0,
              "color": "#1e4a80"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      }
    },
    {
      "stableId": "-113",
      "layerType": "component",
      "displayName": "사각형",
      "x": 125,
      "y": 0,
      "zIndex": 3,
      "visual": {
        "model": {
          "shape": {
            "type": "rectangle",
            "width": 324,
            "height": 80,
            "radius": 0,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#fef1b3",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": false,
              "size": 0,
              "color": "#1e4a80"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      }
    },
    {
      "stableId": "pause-119",
      "layerType": "component",
      "displayName": "pause",
      "x": 67,
      "y": 64,
      "zIndex": 4,
      "visual": {
        "model": {
          "shape": {
            "type": "rectangle",
            "width": 385,
            "height": 57,
            "radius": 0,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#ddafef",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": false,
              "size": 0,
              "color": "#1e4a80"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      },
      "texts": [
        {
          "slotIndex": 0,
          "staticContent": "PAUSE",
          "bindingKey": "",
          "fontSize": 30,
          "fontWeight": "bold",
          "fontFamily": "\"Baloo 2\", cursive",
          "color": "#ffffff",
          "offsetX": -30,
          "offsetY": 0,
          "zIndex": 1,
          "style": {
            "stroke": {
              "width": 0,
              "color": "#000000"
            },
            "depth": {
              "size": 0,
              "color": "rgba(0,0,0,0)"
            },
            "shadow": {
              "x": 0,
              "y": 1,
              "blur": 2,
              "color": "rgba(0,0,0,0)",
              "opacity": 50
            }
          }
        }
      ]
    },
    {
      "stableId": "re-start-115",
      "layerType": "component",
      "displayName": "re start",
      "x": 110,
      "y": 207,
      "zIndex": 5,
      "visual": {
        "model": {
          "shape": {
            "type": "pill",
            "width": 237,
            "height": 48,
            "radius": 12,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#80cf77",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": true,
              "size": 4,
              "color": "#6ab079"
            },
            {
              "type": "outer",
              "enabled": true,
              "x": 0,
              "y": 7,
              "blur": 4,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": true,
              "x": 0,
              "y": 3,
              "blur": 0,
              "color": "#ffffff",
              "opacity": 35
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      },
      "effects": [
        {
          "type": "press",
          "source": {
            "provider": "internal",
            "name": "press"
          },
          "enabled": true,
          "target": "self",
          "trigger": "pointer",
          "params": {
            "transitionMs": 100,
            "brightness": 95,
            "scale": 100,
            "useDepthOffset": true
          }
        },
        {
          "type": "css-animation",
          "source": {
            "provider": "animate.css",
            "name": "bounce-in",
            "className": "animate__bounceIn"
          },
          "enabled": true,
          "target": "self",
          "trigger": "mount",
          "timing": {
            "durationMs": 800,
            "delayMs": 0,
            "iteration": 1,
            "loopDelayMs": 600
          },
          "params": {
            "presetId": "bounce-in",
            "group": "Appear",
            "phase": "enter",
            "className": "animate__bounceIn",
            "baseClass": "animate__animated",
            "loop": false
          }
        }
      ],
      "texts": [
        {
          "slotIndex": 0,
          "staticContent": "RESTART",
          "bindingKey": "",
          "fontSize": 20,
          "fontWeight": "bold",
          "fontFamily": "\"Baloo 2\", cursive",
          "color": "#ffffff",
          "offsetX": 0,
          "offsetY": 0,
          "zIndex": 1,
          "style": {
            "stroke": {
              "width": 0.5,
              "color": "rgba(86,164,120,0)"
            },
            "depth": {
              "size": 0,
              "color": "#000000"
            },
            "shadow": {
              "x": 0,
              "y": 1,
              "blur": 2,
              "color": "rgba(0,0,0,0)",
              "opacity": 50
            }
          }
        }
      ],
      "events": [
        {
          "trigger": "click",
          "eventName": "re-start-115:click"
        }
      ]
    },
    {
      "stableId": "re-play-114",
      "layerType": "component",
      "displayName": "re play",
      "x": 110,
      "y": 140,
      "zIndex": 6,
      "visual": {
        "model": {
          "shape": {
            "type": "pill",
            "width": 237,
            "height": 48,
            "radius": 12,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#47b2ff",
            "color2": "#cde3fe",
            "angle": 360,
            "depthIntensity": 26,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": true,
              "size": 4,
              "color": "#4898d5"
            },
            {
              "type": "outer",
              "enabled": true,
              "x": 0,
              "y": 7,
              "blur": 4,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": true,
              "x": 0,
              "y": 3,
              "blur": 0,
              "color": "#ffffff",
              "opacity": 35
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      },
      "effects": [
        {
          "type": "press",
          "source": {
            "provider": "internal",
            "name": "press"
          },
          "enabled": true,
          "target": "self",
          "trigger": "pointer",
          "params": {
            "transitionMs": 100,
            "brightness": 95,
            "scale": 100,
            "useDepthOffset": true
          }
        },
        {
          "type": "css-animation",
          "source": {
            "provider": "animate.css",
            "name": "bounce-in",
            "className": "animate__bounceIn"
          },
          "enabled": true,
          "target": "self",
          "trigger": "mount",
          "timing": {
            "durationMs": 800,
            "delayMs": 0,
            "iteration": 1,
            "loopDelayMs": 600
          },
          "params": {
            "presetId": "bounce-in",
            "group": "Appear",
            "phase": "enter",
            "className": "animate__bounceIn",
            "baseClass": "animate__animated",
            "loop": false
          }
        }
      ],
      "texts": [
        {
          "slotIndex": 0,
          "staticContent": "REPLAY",
          "bindingKey": "",
          "fontSize": 20,
          "fontWeight": "bold",
          "fontFamily": "\"Baloo 2\", cursive",
          "color": "#ffffff",
          "offsetX": 0,
          "offsetY": 0,
          "zIndex": 1,
          "style": {
            "stroke": {
              "width": 0.5,
              "color": "#56a478"
            },
            "depth": {
              "size": 0,
              "color": "#000000"
            },
            "shadow": {
              "x": 0,
              "y": 1,
              "blur": 2,
              "color": "rgba(0,0,0,0)",
              "opacity": 50
            }
          }
        }
      ],
      "events": [
        {
          "trigger": "click",
          "eventName": "re play"
        }
      ]
    },
    {
      "stableId": "bgm-184",
      "layerType": "component",
      "displayName": "bgm",
      "x": 95,
      "y": 312,
      "zIndex": 16,
      "visual": {
        "model": {
          "shape": {
            "type": "rectangle",
            "width": 160,
            "height": 40,
            "radius": 12,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "none",
            "color1": "#4a90d9",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": false,
              "size": 0,
              "color": "#1e4a80"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      },
      "texts": [
        {
          "slotIndex": 0,
          "staticContent": "BGM",
          "bindingKey": "",
          "fontSize": 16,
          "fontWeight": "bold",
          "fontFamily": "\"Baloo 2\", cursive",
          "color": "#452510",
          "offsetX": -12,
          "offsetY": 0,
          "style": {
            "stroke": {
              "width": 0,
              "color": "#000000"
            },
            "depth": {
              "size": 0,
              "color": "#000000"
            },
            "shadow": {
              "x": 0,
              "y": 2,
              "blur": 4,
              "color": "rgba(0,0,0,0)",
              "opacity": 60
            }
          }
        }
      ]
    },
    {
      "stableId": "sfx-185",
      "layerType": "component",
      "displayName": "sfx",
      "x": 93,
      "y": 383,
      "zIndex": 16,
      "visual": {
        "model": {
          "shape": {
            "type": "rectangle",
            "width": 160,
            "height": 40,
            "radius": 12,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "none",
            "color1": "#4a90d9",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": false,
              "size": 0,
              "color": "#1e4a80"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      },
      "texts": [
        {
          "slotIndex": 0,
          "staticContent": "SFX",
          "bindingKey": "",
          "fontSize": 16,
          "fontWeight": "bold",
          "fontFamily": "\"Baloo 2\", cursive",
          "color": "#48240e",
          "offsetX": -12,
          "offsetY": 0,
          "style": {
            "stroke": {
              "width": 0,
              "color": "#000000"
            },
            "depth": {
              "size": 0,
              "color": "#000000"
            },
            "shadow": {
              "x": 0,
              "y": 2,
              "blur": 4,
              "color": "rgba(0,0,0,0)",
              "opacity": 60
            }
          }
        }
      ]
    },
    {
      "stableId": "vibration-187",
      "layerType": "component",
      "displayName": "vibration",
      "x": 93,
      "y": 445,
      "zIndex": 16,
      "visual": {
        "model": {
          "shape": {
            "type": "rectangle",
            "width": 160,
            "height": 40,
            "radius": 12,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "none",
            "color1": "#4a90d9",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": false,
              "size": 0,
              "color": "#1e4a80"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      },
      "texts": [
        {
          "slotIndex": 0,
          "staticContent": "VIBRATION",
          "bindingKey": "",
          "fontSize": 16,
          "fontWeight": "bold",
          "fontFamily": "\"Baloo 2\", cursive",
          "color": "#3c1b09",
          "offsetX": 12,
          "offsetY": 0,
          "style": {
            "stroke": {
              "width": 0,
              "color": "#000000"
            },
            "depth": {
              "size": 0,
              "color": "#000000"
            },
            "shadow": {
              "x": 0,
              "y": 2,
              "blur": 4,
              "color": "rgba(0,0,0,0)",
              "opacity": 60
            }
          }
        }
      ]
    },
    {
      "stableId": "shape-round-rect-190",
      "layerType": "component",
      "displayName": "둥근 사각형",
      "x": 98,
      "y": 283,
      "zIndex": 10,
      "visual": {
        "model": {
          "shape": {
            "type": "rectangle",
            "width": 262,
            "height": 231,
            "radius": 16,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#f3e49b",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": true,
              "size": 3,
              "color": "#fff5c2"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 2,
              "blur": 4,
              "color": "#000000",
              "opacity": 13
            },
            {
              "type": "inner",
              "enabled": true,
              "x": 0,
              "y": 3,
              "blur": 0,
              "color": "#2a333c",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      }
    },
    {
      "stableId": "pictoicon-music-on-png-251",
      "layerType": "image",
      "displayName": "PictoIcon_Music_On.Png",
      "x": 111,
      "y": 318,
      "zIndex": 11,
      "visual": {
        "exportPath": "assets/PictoIcon_Music_On.Png",
        "width": 30,
        "height": 30,
        "style": {
          "shadow": {
            "enabled": false,
            "x": 0,
            "y": 4,
            "blur": 8,
            "color": "#000000",
            "opacity": 50
          },
          "tint": {
            "mode": "overlay",
            "color": "#43200d",
            "strength": 100
          }
        }
      }
    },
    {
      "stableId": "pictoicon-sfx-on-png-252",
      "layerType": "image",
      "displayName": "PictoIcon_Sfx_On.Png",
      "x": 111,
      "y": 388,
      "zIndex": 12,
      "visual": {
        "exportPath": "assets/PictoIcon_Sfx_On.Png",
        "width": 30,
        "height": 30,
        "style": {
          "shadow": {
            "enabled": false,
            "x": 0,
            "y": 4,
            "blur": 8,
            "color": "#ffffff",
            "opacity": 50
          },
          "tint": {
            "mode": "overlay",
            "color": "#43200d",
            "strength": 100
          }
        }
      }
    },
    {
      "stableId": "haptics-png-253",
      "layerType": "image",
      "displayName": "Haptics.png",
      "x": 109,
      "y": 448,
      "zIndex": 13,
      "visual": {
        "exportPath": "assets/Haptics.png",
        "width": 30,
        "height": 30,
        "style": {
          "shadow": {
            "enabled": false,
            "x": 0,
            "y": 4,
            "blur": 8,
            "color": "#000000",
            "opacity": 50
          },
          "tint": {
            "mode": "overlay",
            "color": "#43200d",
            "strength": 100
          }
        }
      }
    },
    {
      "stableId": "-254",
      "layerType": "component",
      "displayName": "알약",
      "x": 249,
      "y": 312,
      "zIndex": 14,
      "visual": {
        "model": {
          "shape": {
            "type": "pill",
            "width": 96,
            "height": 40,
            "radius": 12,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#e9d881",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": true,
              "size": 2,
              "color": "#fff7e4"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      }
    },
    {
      "stableId": "jewel-soket-png-256",
      "layerType": "image",
      "displayName": "jewel_soket.png",
      "x": 299,
      "y": 307,
      "zIndex": 15,
      "visual": {
        "exportPath": "assets/jewel_soket.png",
        "width": 52,
        "height": 40,
        "style": {
          "shadow": {
            "enabled": true,
            "x": 0,
            "y": -3,
            "blur": 1,
            "color": "#b17c20",
            "opacity": 39
          },
          "tint": {
            "mode": "tint",
            "color": "#5cdeff",
            "strength": 100
          }
        }
      },
      "rotation": 180
    },
    {
      "stableId": "icon-whiteicon-check-s-png-258",
      "layerType": "image",
      "displayName": "Icon_WhiteIcon_check_s.png",
      "x": 265,
      "y": 320,
      "zIndex": 16,
      "visual": {
        "exportPath": "assets/Icon_WhiteIcon_check_s.png",
        "width": 25,
        "height": 25,
        "style": {
          "shadow": {
            "enabled": false,
            "x": 0,
            "y": 4,
            "blur": 8,
            "color": "#000000",
            "opacity": 50
          },
          "tint": {
            "mode": "overlay",
            "color": "#71c167",
            "strength": 100
          }
        }
      }
    },
    {
      "stableId": "shape-pill-274",
      "layerType": "component",
      "displayName": "알약",
      "x": 249,
      "y": 311,
      "zIndex": 20,
      "visual": {
        "model": {
          "shape": {
            "type": "pill",
            "width": 96,
            "height": 40,
            "radius": 12,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#e9d881",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": true,
              "size": 2,
              "color": "#fff7e4"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      }
    },
    {
      "stableId": "jewel-soket-png-275",
      "layerType": "image",
      "displayName": "jewel_soket.png",
      "x": 235,
      "y": 307,
      "zIndex": 21,
      "visual": {
        "exportPath": "assets/jewel_soket.png",
        "width": 52,
        "height": 40,
        "style": {
          "shadow": {
            "enabled": true,
            "x": 0,
            "y": -3,
            "blur": 1,
            "color": "#1e293b",
            "opacity": 39
          },
          "tint": {
            "mode": "tint",
            "color": "#5cffb8",
            "strength": 100
          }
        }
      },
      "rotation": 180
    },
    {
      "stableId": "icon-whiteicon-close-png-277",
      "layerType": "image",
      "displayName": "Icon_WhiteIcon_Close.png",
      "x": 308,
      "y": 322,
      "zIndex": 22,
      "visual": {
        "exportPath": "assets/Icon_WhiteIcon_Close.png",
        "width": 20,
        "height": 20,
        "style": {
          "shadow": {
            "enabled": false,
            "x": 0,
            "y": 4,
            "blur": 8,
            "color": "#000000",
            "opacity": 50
          },
          "tint": {
            "mode": "overlay",
            "color": "#afa364",
            "strength": 100
          }
        }
      }
    },
    {
      "stableId": "-304",
      "layerType": "component",
      "displayName": "알약",
      "x": 249,
      "y": 381,
      "zIndex": 21,
      "visual": {
        "model": {
          "shape": {
            "type": "pill",
            "width": 96,
            "height": 40,
            "radius": 12,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#e9d881",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": true,
              "size": 2,
              "color": "#fff7e4"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      }
    },
    {
      "stableId": "jewel-soket-png-305",
      "layerType": "image",
      "displayName": "jewel_soket.png",
      "x": 299,
      "y": 376,
      "zIndex": 22,
      "visual": {
        "exportPath": "assets/jewel_soket.png",
        "width": 52,
        "height": 40,
        "style": {
          "shadow": {
            "enabled": true,
            "x": 0,
            "y": -3,
            "blur": 1,
            "color": "#b17c20",
            "opacity": 39
          },
          "tint": {
            "mode": "tint",
            "color": "#5cdeff",
            "strength": 100
          }
        }
      },
      "rotation": 180
    },
    {
      "stableId": "icon-whiteicon-check-s-png-306",
      "layerType": "image",
      "displayName": "Icon_WhiteIcon_check_s.png",
      "x": 265,
      "y": 389,
      "zIndex": 23,
      "visual": {
        "exportPath": "assets/Icon_WhiteIcon_check_s.png",
        "width": 25,
        "height": 25,
        "style": {
          "shadow": {
            "enabled": false,
            "x": 0,
            "y": 4,
            "blur": 8,
            "color": "#000000",
            "opacity": 50
          },
          "tint": {
            "mode": "overlay",
            "color": "#71c167",
            "strength": 100
          }
        }
      }
    },
    {
      "stableId": "shape-pill-307",
      "layerType": "component",
      "displayName": "알약",
      "x": 249,
      "y": 380,
      "zIndex": 27,
      "visual": {
        "model": {
          "shape": {
            "type": "pill",
            "width": 96,
            "height": 40,
            "radius": 12,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#e9d881",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": true,
              "size": 2,
              "color": "#fff7e4"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      }
    },
    {
      "stableId": "jewel-soket-png-308",
      "layerType": "image",
      "displayName": "jewel_soket.png",
      "x": 235,
      "y": 376,
      "zIndex": 28,
      "visual": {
        "exportPath": "assets/jewel_soket.png",
        "width": 52,
        "height": 40,
        "style": {
          "shadow": {
            "enabled": true,
            "x": 0,
            "y": -3,
            "blur": 1,
            "color": "#1e293b",
            "opacity": 39
          },
          "tint": {
            "mode": "tint",
            "color": "#5cffb8",
            "strength": 100
          }
        }
      },
      "rotation": 180
    },
    {
      "stableId": "icon-whiteicon-close-png-309",
      "layerType": "image",
      "displayName": "Icon_WhiteIcon_Close.png",
      "x": 308,
      "y": 391,
      "zIndex": 29,
      "visual": {
        "exportPath": "assets/Icon_WhiteIcon_Close.png",
        "width": 20,
        "height": 20,
        "style": {
          "shadow": {
            "enabled": false,
            "x": 0,
            "y": 4,
            "blur": 8,
            "color": "#000000",
            "opacity": 50
          },
          "tint": {
            "mode": "overlay",
            "color": "#afa364",
            "strength": 100
          }
        }
      }
    },
    {
      "stableId": "-310",
      "layerType": "component",
      "displayName": "알약",
      "x": 249,
      "y": 448,
      "zIndex": 27,
      "visual": {
        "model": {
          "shape": {
            "type": "pill",
            "width": 96,
            "height": 40,
            "radius": 12,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#e9d881",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": true,
              "size": 2,
              "color": "#fff7e4"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      }
    },
    {
      "stableId": "jewel-soket-png-311",
      "layerType": "image",
      "displayName": "jewel_soket.png",
      "x": 299,
      "y": 443,
      "zIndex": 28,
      "visual": {
        "exportPath": "assets/jewel_soket.png",
        "width": 52,
        "height": 40,
        "style": {
          "shadow": {
            "enabled": true,
            "x": 0,
            "y": -3,
            "blur": 1,
            "color": "#b17c20",
            "opacity": 39
          },
          "tint": {
            "mode": "tint",
            "color": "#5cdeff",
            "strength": 100
          }
        }
      },
      "rotation": 180
    },
    {
      "stableId": "icon-whiteicon-check-s-png-312",
      "layerType": "image",
      "displayName": "Icon_WhiteIcon_check_s.png",
      "x": 265,
      "y": 456,
      "zIndex": 29,
      "visual": {
        "exportPath": "assets/Icon_WhiteIcon_check_s.png",
        "width": 25,
        "height": 25,
        "style": {
          "shadow": {
            "enabled": false,
            "x": 0,
            "y": 4,
            "blur": 8,
            "color": "#000000",
            "opacity": 50
          },
          "tint": {
            "mode": "overlay",
            "color": "#71c167",
            "strength": 100
          }
        }
      }
    },
    {
      "stableId": "shape-pill-313",
      "layerType": "component",
      "displayName": "알약",
      "x": 249,
      "y": 447,
      "zIndex": 33,
      "visual": {
        "model": {
          "shape": {
            "type": "pill",
            "width": 96,
            "height": 40,
            "radius": 12,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "solid",
            "color1": "#e9d881",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": true,
              "size": 2,
              "color": "#fff7e4"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      }
    },
    {
      "stableId": "jewel-soket-png-314",
      "layerType": "image",
      "displayName": "jewel_soket.png",
      "x": 235,
      "y": 443,
      "zIndex": 34,
      "visual": {
        "exportPath": "assets/jewel_soket.png",
        "width": 52,
        "height": 40,
        "style": {
          "shadow": {
            "enabled": true,
            "x": 0,
            "y": -3,
            "blur": 1,
            "color": "#1e293b",
            "opacity": 39
          },
          "tint": {
            "mode": "tint",
            "color": "#5cffb8",
            "strength": 100
          }
        }
      },
      "rotation": 180
    },
    {
      "stableId": "icon-whiteicon-close-png-315",
      "layerType": "image",
      "displayName": "Icon_WhiteIcon_Close.png",
      "x": 308,
      "y": 458,
      "zIndex": 35,
      "visual": {
        "exportPath": "assets/Icon_WhiteIcon_Close.png",
        "width": 20,
        "height": 20,
        "style": {
          "shadow": {
            "enabled": false,
            "x": 0,
            "y": 4,
            "blur": 8,
            "color": "#000000",
            "opacity": 50
          },
          "tint": {
            "mode": "overlay",
            "color": "#afa364",
            "strength": 100
          }
        }
      }
    }
  ]
};

export const STAGE_CLEAR_CONTRACT = {
  "contractVersion": 1,
  "sceneId": "stage-clear",
  "sceneName": "Stage_Clear",
  "canvas": {
    "width": 390,
    "height": 844
  },
  "viewport": {
    "width": 390,
    "height": 844
  },
  "background": {
    "type": "none",
    "color": "rgba(245,245,245,0)",
    "color2": "#0e4a8c",
    "gradientAngle": 180,
    "imagePath": "",
    "tileSize": 64,
    "stretchMode": "cover",
    "scrollEnabled": false,
    "scrollDirection": "right",
    "scrollDuration": 4
  },
  "groups": [],
  "sceneAnimations": [],
  "layers": [
    {
      "stableId": "clear-orbit-42",
      "layerType": "confetti",
      "displayName": "Clear Orbit",
      "x": 25,
      "y": 100,
      "zIndex": 1,
      "visible": false,
      "visual": {
        "width": 320,
        "height": 240,
        "confetti": {
          "confettiPattern": "clear-orbit",
          "particleCount": 30,
          "duration": 1200,
          "spread": 360,
          "velocity": 350,
          "colors": [
            "#ff3b3b",
            "#ffd23b",
            "#3bff7a",
            "#3bb6ff",
            "#c63bff",
            "#ffffff"
          ],
          "sizeMin": 7,
          "sizeMax": 9,
          "shape": "circle",
          "autoplay": true,
          "loop": true,
          "triggerKey": ""
        }
      },
      "effects": [
        {
          "type": "confetti",
          "source": {
            "provider": "internal",
            "name": "confetti"
          },
          "enabled": true,
          "target": "self",
          "trigger": "mount",
          "params": {
            "pattern": "clear-orbit",
            "particleCount": 30,
            "durationMs": 1200,
            "spread": 360,
            "velocity": 350,
            "colors": [
              "#ff3b3b",
              "#ffd23b",
              "#3bff7a",
              "#3bb6ff",
              "#c63bff",
              "#ffffff"
            ],
            "sizeMin": 7,
            "sizeMax": 9,
            "shape": "circle",
            "autoplay": true,
            "loop": true,
            "triggerKey": ""
          }
        }
      ]
    },
    {
      "stableId": "confetti-43",
      "layerType": "confetti",
      "displayName": "Confetti",
      "x": 35,
      "y": 115,
      "zIndex": 2,
      "visual": {
        "width": 320,
        "height": 240,
        "confetti": {
          "confettiPattern": "center-burst",
          "particleCount": 80,
          "duration": 1800,
          "spread": 360,
          "velocity": 400,
          "colors": [
            "#ff3b3b",
            "#ffd23b",
            "#3bff7a",
            "#3bb6ff",
            "#c63bff",
            "#ffffff"
          ],
          "sizeMin": 6,
          "sizeMax": 12,
          "shape": "mixed",
          "autoplay": true,
          "loop": false,
          "triggerKey": ""
        }
      },
      "effects": [
        {
          "type": "confetti",
          "source": {
            "provider": "internal",
            "name": "confetti"
          },
          "enabled": true,
          "target": "self",
          "trigger": "mount",
          "params": {
            "pattern": "center-burst",
            "particleCount": 80,
            "durationMs": 1800,
            "spread": 360,
            "velocity": 400,
            "colors": [
              "#ff3b3b",
              "#ffd23b",
              "#3bff7a",
              "#3bb6ff",
              "#c63bff",
              "#ffffff"
            ],
            "sizeMin": 6,
            "sizeMax": 12,
            "shape": "mixed",
            "autoplay": true,
            "loop": false,
            "triggerKey": ""
          }
        }
      ]
    },
    {
      "stableId": "rays-burst-44",
      "layerType": "component",
      "displayName": "Rays Burst",
      "x": -354,
      "y": -277,
      "zIndex": 3,
      "visible": false,
      "visual": {
        "model": {
          "shape": {
            "type": "circle",
            "width": 1099,
            "height": 1029,
            "radius": 0,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "conic-gradient",
            "color1": "rgba(254,250,225,0.84)",
            "color2": "rgba(254,253,236,0.48)",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": false,
              "size": 3,
              "color": "#1e4a80"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 4,
              "blur": 8,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 1,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 15
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": true,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      },
      "effects": [
        {
          "type": "spin",
          "source": {
            "provider": "internal",
            "name": "spin"
          },
          "enabled": true,
          "target": "self",
          "timing": {
            "durationMs": 4000,
            "easing": "linear",
            "iteration": "infinite"
          },
          "params": {
            "direction": "cw"
          }
        }
      ]
    },
    {
      "stableId": "stage-clear-66",
      "layerType": "component",
      "displayName": "Stage clear",
      "x": 69,
      "y": 31,
      "zIndex": 24,
      "visual": {
        "model": {
          "shape": {
            "type": "rectangle",
            "width": 252,
            "height": 52,
            "radius": 0,
            "notch": 20,
            "hollowThickness": 8
          },
          "fill": {
            "type": "none",
            "color1": "#4a90d9",
            "color2": "#2e6ab4",
            "angle": 180,
            "depthIntensity": 50,
            "rayCount": 8
          },
          "border": {
            "width": 0,
            "color": "#6bb5ff"
          },
          "shadows": [
            {
              "type": "depth-edge",
              "enabled": false,
              "size": 0,
              "color": "#1e4a80"
            },
            {
              "type": "outer",
              "enabled": false,
              "x": 0,
              "y": 6,
              "blur": 12,
              "color": "#000000",
              "opacity": 30
            },
            {
              "type": "inner",
              "enabled": false,
              "x": 0,
              "y": 2,
              "blur": 4,
              "color": "#ffffff",
              "opacity": 20
            }
          ],
          "mask": {
            "type": "ring-fade",
            "enabled": false,
            "innerPct": 28,
            "outerPct": 76
          }
        }
      },
      "texts": [
        {
          "slotIndex": 0,
          "staticContent": "Stage clear",
          "bindingKey": "",
          "fontSize": 37,
          "fontWeight": "bold",
          "fontFamily": "\"Baloo 2\", cursive",
          "color": "#ffffff",
          "offsetX": 0,
          "offsetY": 0,
          "zIndex": 3,
          "style": {
            "stroke": {
              "width": 0.5,
              "color": "#56a478"
            },
            "depth": {
              "size": 0,
              "color": "#000000"
            },
            "shadow": {
              "x": -10,
              "y": -10,
              "blur": 0,
              "color": "rgba(0,0,0,0)",
              "opacity": 60
            }
          }
        }
      ]
    },
    {
      "stableId": "label-png-73",
      "layerType": "image",
      "displayName": "label.png",
      "x": 40,
      "y": -31,
      "zIndex": 5,
      "visual": {
        "exportPath": "assets/label.png",
        "width": 310,
        "height": 199,
        "style": {
          "shadow": {
            "enabled": false,
            "x": 0,
            "y": 4,
            "blur": 8,
            "color": "#000000",
            "opacity": 50
          },
          "tint": {
            "mode": "tint",
            "color": "#ffa8a8",
            "strength": 100
          }
        }
      }
    }
  ]
};

export const TITLE_CONTRACT = {
  "contractVersion": 1,
  "sceneId": "title",
  "sceneName": "title",
  "canvas": {
    "width": 393,
    "height": 852
  },
  "viewport": {
    "width": 393,
    "height": 852
  },
  "background": {
    "type": "linear-gradient",
    "color": "#fffef6",
    "color2": "#f7e3ab",
    "gradientAngle": 180,
    "imagePath": "",
    "tileSize": 64,
    "stretchMode": "cover",
    "scrollEnabled": false,
    "scrollDirection": "right",
    "scrollDuration": 4
  },
  "groups": [],
  "fxGroups": [],
  "sceneAnimations": [],
  "layers": [
    {
      "stableId": "title-png-4",
      "layerType": "image",
      "displayName": "title.png",
      "x": 21,
      "y": 102,
      "zIndex": 1,
      "visual": {
        "exportPath": "assets/title.png",
        "width": 348,
        "height": 365
      }
    },
    {
      "stableId": "animation-5-png-6",
      "layerType": "image",
      "displayName": "animation (5).png",
      "x": 163,
      "y": 665,
      "zIndex": 2,
      "visual": {
        "exportPath": "assets/animation (5).png",
        "width": 64,
        "height": 64
      }
    }
  ]
};
