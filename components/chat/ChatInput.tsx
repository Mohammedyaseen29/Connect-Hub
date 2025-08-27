"use client"
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import qs from "query-string";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";
import { ArrowUp, Plus, Smile } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/Hooks/use-modal-hook";
import EmojiPicker from "../EmojiPicker";

interface ChatInputProps {
    apiUrl: string;
    query: Record<string, any>;
    name: string;
    type: "conversation" | "channel";
}

const ChatInput = ({ apiUrl, query, name, type }: ChatInputProps) => {
    const router = useRouter();
    const { onOpen } = useModal();

    const formSchema = z.object({
        content: z.string().min(1),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: "",
        }
    });

    const isLoading = form.formState.isSubmitting;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const originalContent = values.content;
            form.reset();

            const url = qs.stringifyUrl({
                url: apiUrl,
                query
            })
            const response = await Promise.race([
                axios.post(url, values),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), 10000)
                )
            ]);

            console.log("Message sent successfully");

        } catch (error) {
            console.error("Error sending message:", error);
            form.setValue("content", values.content);

            // You might want to show a toast notification here
            // toast.error("Failed to send message. Please try again.");
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField name="content" control={form.control} render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <div className="relative p-4 pb-6">
                                <button
                                    type="button"
                                    onClick={() => onOpen("messageFile", { query, apiUrl })}
                                    className="absolute top-7 left-8 flex items-center justify-center h-[24px] w-[24px] bg-zinc-500 hover:bg-zinc-600 dark:bg-zinc-400 p-1 dark:hover:bg-zinc-300 transition rounded-full"
                                >
                                    <Plus className="text-white dark:text-[#313338]" />
                                </button>

                                <Input
                                    disabled={isLoading}
                                    placeholder={`Message ${type == "conversation" ? name : "# " + name}`}
                                    className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 text-zinc-600 dark:text-zinc-200 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    {...field}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            form.handleSubmit(onSubmit)();
                                        }
                                    }}
                                />

                                <div className="absolute top-7 right-20">
                                    <EmojiPicker onChange={(emoji: string) => field.onChange(`${field.value} ${emoji}`)} />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !field.value.trim()}
                                    className="absolute top-7 right-8 bg-green-500 rounded-full mb-3 hover:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ArrowUp className="p-1" />
                                </button>
                            </div>
                        </FormControl>
                    </FormItem>
                )} />
            </form>
        </Form>
    )
}

export default ChatInput