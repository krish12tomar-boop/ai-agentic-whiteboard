import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import axios from 'axios'
import { useRouter } from 'next/navigation'
function CreateNewBoardDialog() {

    const [workspaceName, setWorkspaceName] = useState("");
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState(false);
    const route = useRouter();
    const handleCreateBoard = async () => {
        const projectName = workspaceName.trim();
        if (projectName === "" || projectName.length > 30) {
            toast.add({
                type: "error",
                title: "Invalid Workspace Name",
                description: "Please enter a valid workspace name (1-30) "
            })

            return;
        }
        setLoading(true);
        try {
            const projectId = crypto.randomUUID();
            await axios.post("/api/projects", {
                projectName,
                projectId
            });
            toast.add({
                type: "success",
                title: "New Workspace Created",
            });
            setDialog(false);
            route.push("/workspace/" + projectId);
        } catch {
            toast.add({
                type: "error",
                title: "Could not create workspace",
                description: "Please try again."
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={dialog} onOpenChange={setDialog} >
            <DialogTrigger render={<Button className="w-full" />}>
                <Plus /> Create New Board
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold" >Whiteboard Workspace Name </DialogTitle>

                </DialogHeader>
                <div>
                    <label className="text-gray-500" >Enter Whiteboard Workspace Name</label>
                    <Input placeholder="Workspace Name " className="mt-1"
                        onChange={(e) => setWorkspaceName(e.target.value)}
                    />
                </div>

                <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                        Cancel
                    </DialogClose>
                    <Button
                        disabled={workspaceName?.length == 0 || loading}
                        onClick={handleCreateBoard}>
                        {loading && <Loader2 className="animate-spin" />}
                        Create</Button>
                </DialogFooter>
            </DialogContent>


        </Dialog>
    )
}

export default CreateNewBoardDialog
