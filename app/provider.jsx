"use client"
import React, { useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { MessagesContext } from '@/context/MessagesContext';
import { ThemeColorProvider } from '@/context/ThemeColorContext';
import { ModelProvider } from '@/context/ModelContext';
import supabase from '@/lib/supabaseClient';

export const SessionContext = React.createContext({ session: null });

function Provider({children}) {
  const [messages,setMessages]=useState();
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session }}>
      <ThemeColorProvider>
        <ModelProvider>
          <MessagesContext.Provider value={{messages,setMessages}}>
          <NextThemesProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem 
              disableTransitionOnChange
              >
              {children}
          </NextThemesProvider>
        </MessagesContext.Provider>
        </ModelProvider>
      </ThemeColorProvider>
    </SessionContext.Provider>
  );
}

export default Provider;