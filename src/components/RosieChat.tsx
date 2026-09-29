import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import rosieImage from "@/assets/rosie-guide.png";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";

const LOCAL_KEY = "roseai.rosie.messages.v1";
const GREETING: UIMessage = {
  id: "rosie-welcome",
  role: "assistant",
  parts: [{ type: "text", text: "Hi, I’m Rosie 🌹 I can help you through Rose AI, explain your skin-tracking results, or help you prepare questions for a qualified professional. What’s on your mind?" }],
};

function readLocal(): UIMessage[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    return Array.isArray(parsed) && parsed.length ? parsed : [GREETING];
  } catch { return [GREETING]; }
}

async function saveMessages(messages: UIMessage[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const { error } = await supabase.from("rosie_conversations").upsert({
    user_id: data.session.user.id,
    messages: JSON.parse(JSON.stringify(messages)),
  });
  if (error) console.error("Rosie conversation could not be saved", error.message);
}

function RosieConversation({ initialMessages }: { initialMessages: UIMessage[] }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/rosie-chat" }), []);
  const { messages, sendMessage, status, stop, error } = useChat({
    id: "rosie-one-conversation",
    messages: initialMessages,
    transport,
    onFinish: ({ messages: finished }) => { void saveMessages(finished); },
  });
  useEffect(() => { if (status === "ready") textareaRef.current?.focus(); }, [status]);
  const submit = () => {
    const text = input.trim();
    if (!text || status === "submitted" || status === "streaming") return;
    setInput("");
    void sendMessage({ text });
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-5 px-4 pb-4 pt-2">
          {messages.map((message) => (
            <div key={message.id} className={message.role === "assistant" ? "flex items-start gap-2.5" : ""}>
              {message.role === "assistant" && <img src={rosieImage} alt="" width={1024} height={1024} loading="lazy" className="mt-1 h-9 w-9 shrink-0 object-contain" />}
              <Message from={message.role} className="min-w-0 flex-1">
                <MessageContent className={message.role === "user" ? "bg-primary text-primary-foreground" : "bg-transparent px-0 py-0 text-foreground"}>
                  {message.parts.map((part, index) => part.type === "text" ? <MessageResponse key={index}>{part.text}</MessageResponse> : null)}
                </MessageContent>
              </Message>
            </div>
          ))}
          {status === "submitted" && <div className="flex items-center gap-2.5"><img src={rosieImage} alt="" width={1024} height={1024} loading="lazy" className="h-9 w-9 object-contain" /><Shimmer className="text-sm">Rosie is thinking…</Shimmer></div>}
          {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error.message || "Rosie couldn't reply. Please try again."}</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <PromptInput onSubmit={submit} className="bg-background">
          <PromptInputTextarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Rosie…" aria-label="Message Rosie" className="min-h-20" />
          <PromptInputFooter>
            <p className="text-[0.6875rem] text-muted-foreground">Don’t share sensitive personal details.</p>
            <PromptInputSubmit status={status} onStop={stop} disabled={!input.trim() && status === "ready"} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

export function RosieChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[] | null>(null);
  useEffect(() => {
    if (!open || messages) return;
    void (async () => {
      const local = readLocal();
      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) { setMessages(local); return; }
      const { data } = await supabase.from("rosie_conversations").select("messages").eq("user_id", auth.session.user.id).maybeSingle();
      const cloud = data?.messages;
      setMessages(Array.isArray(cloud) && cloud.length ? cloud as unknown as UIMessage[] : local);
    })();
  }, [open, messages]);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button type="button" size="icon" aria-label="Talk to Rosie AI" className="fixed bottom-24 right-[max(1rem,calc((100vw-30rem)/2+1rem))] z-30 h-16 w-16 overflow-hidden rounded-full border-2 border-card bg-accent p-0 shadow-lg hover:bg-accent">
          <img src={rosieImage} alt="" width={1024} height={1024} className="h-full w-full object-contain" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="mx-auto h-[88dvh] max-w-[30rem] overflow-hidden">
        <DrawerHeader className="flex-row items-center gap-3 border-b border-border text-left">
          <img src={rosieImage} alt="" width={1024} height={1024} loading="lazy" className="h-12 w-12 object-contain" />
          <div className="min-w-0 flex-1"><DrawerTitle className="font-display text-2xl">Rosie AI</DrawerTitle><DrawerDescription>Your warm Rose AI guide</DrawerDescription></div>
          <DrawerClose asChild><Button type="button" variant="ghost" size="icon" aria-label="Close Rosie"><X /></Button></DrawerClose>
        </DrawerHeader>
        {messages ? <RosieConversation initialMessages={messages} /> : <div className="flex flex-1 items-center justify-center"><Shimmer>Opening your conversation…</Shimmer></div>}
      </DrawerContent>
    </Drawer>
  );
}