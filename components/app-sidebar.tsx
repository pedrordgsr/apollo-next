"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

// Função para buscar os dados do usuário atual
export const getCurrentUser = async () => {
  try {
    // Obtém o ID do usuário do localStorage
    const userId = localStorage.getItem("usuarioId")
    if (!userId) {
      throw new Error("ID do usuário não encontrado no localStorage.")
    }

    // Faz a requisição para buscar os dados do usuário
    const response = await api.get(`/funcionarios/${userId}`)
    const userData = response.data
    console.log("Dados do usuário obtidos:", userData)

    // Retorna o nome e o email do usuário
    return {
      name: userData.nome,
      email: userData.email,
    }
  } catch (error) {
    console.error("Erro ao buscar os dados do usuário:", error)
    throw error
  }
}



import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavPessoas } from "@/components/nav-pessoas"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Pedidos",
      url: "#",
      icon: IconDashboard,
    },
    {
      title: "Produtos",
      url: "/produtos",
      icon: IconListDetails,
    },
    {
      title: "Relatórios",
      url: "#",
      icon: IconChartBar,
    }
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Configurações",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Sobre",
      url: "#",
      icon: IconHelp,
    }
  ],
  pessoas: [
    {
      name: "Todas as pessoas",
      url: "/pessoas",
      icon: IconDatabase,
    },
    {
      name: "Funcionários",
      url: "/funcionarios",
      icon: IconReport,
    },
    {
      name: "Clientes",
      url: "/clientes",
      icon: IconFileWord,
    },
    {
      name: "Fornecedores",
      url: "/fornecedores",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState({ name: "", email: "" })

 useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error("Erro ao carregar os dados do usuário:", error)
      }
    }

    fetchUser()
  }, [])
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Apollo ERP</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavPessoas items={data.pessoas} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
