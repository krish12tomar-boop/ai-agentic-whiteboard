"use client"
import SmartDoc from '@/components/custom/workspace/SmartDoc'
import Whiteboard from '@/components/custom/workspace/Whiteboard'
import WorkspaceHeader from '@/components/custom/workspace/WorkspaceHeader'
import { exportToBlob } from '@excalidraw/excalidraw'
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import React, { useState } from 'react'

function Workspace() {
    const [activeTab, setActiveTab] = useState("whiteboard")
    const [api, setApi] = useState<ExcalidrawImperativeAPI | null> (null)

    const handleExportImage = async () => {
        if(!api) return ;

        const blob = await exportToBlob ({
            elements: api.getSceneElements(),
            appState: {
                  ...api.getAppState(),
                  exportBackground: true
            },
            files: api.getFiles(),
            mimeType: "image/png",
            quality: 1
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "whiteboard.png",
        link.click();

        URL.revokeObjectURL(url);
    }
    return (
        <div>
            <WorkspaceHeader
             selectedTab={(value: string) => setActiveTab(value)}
             onExport={() => handleExportImage() }
             />

            {activeTab === "whiteboard" ? 
                <Whiteboard
                 onApiReady={(api)=>setApi(api)}
                /> : <SmartDoc />
            }
        </div>
    )
}

export default Workspace