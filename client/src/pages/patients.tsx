import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { useProfiles } from "@/hooks/use-profiles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Calendar,
  Building2,
  Phone,
  Mail,
  Heart,
  UserPlus,
  ChevronRight,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Profile } from "@shared/schema";

function calculateAge(birthDate: string | Date | null | undefined): number | null {
  if (!birthDate) return null;
  const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (isNaN(date.getTime())) return null;
  return differenceInYears(new Date(), date);
}

export default function Patients() {
  const [, setLocation] = useLocation();
  const { profiles, isLoading, activeProfile, setActiveProfile } = useProfiles();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter profiles based on search term
  const filteredProfiles = useMemo(() => {
    if (!searchTerm.trim()) return profiles;

    const term = searchTerm.toLowerCase();
    return profiles.filter((profile: Profile) => {
      const name = profile.name?.toLowerCase() || "";
      const email = profile.email?.toLowerCase() || "";
      const phone = profile.phone?.toLowerCase() || "";
      const insurance = profile.insuranceType?.toLowerCase() || "";

      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        insurance.includes(term)
      );
    });
  }, [profiles, searchTerm]);

  const handleSelectPatient = (profile: Profile) => {
    setActiveProfile(profile);
  };

  const handleStartService = (profile: Profile) => {
    setActiveProfile(profile);
    setLocation("/atendimento");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Users className="h-8 w-8 text-gray-700" />
                  Pacientes
                </h1>
                <p className="text-gray-600 mt-1">
                  Busque e selecione um paciente para iniciar o atendimento
                </p>
              </div>

              <Button
                onClick={() => {/* TODO: Open new patient modal */}}
                className="bg-charcoal hover:bg-charcoal/90 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Paciente
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nome, email, telefone ou convênio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base bg-white border-gray-200 focus:border-charcoal focus:ring-charcoal"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">
              {filteredProfiles.length} paciente{filteredProfiles.length !== 1 ? 's' : ''} encontrado{filteredProfiles.length !== 1 ? 's' : ''}
            </span>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="text-gray-500 hover:text-gray-700"
              >
                Limpar busca
              </Button>
            )}
          </div>

          {/* Patients List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-charcoal"></div>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? "Tente buscar com outros termos"
                  : "Cadastre seu primeiro paciente para começar"}
              </p>
              {!searchTerm && (
                <Button className="bg-charcoal hover:bg-charcoal/90 text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastrar Paciente
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProfiles.map((profile: Profile) => {
                const age = calculateAge(profile.dateOfBirth);
                const isActive = activeProfile?.id === profile.id;
                const registrationDate = profile.createdAt
                  ? format(new Date(profile.createdAt), "dd/MM/yyyy", { locale: ptBR })
                  : null;

                return (
                  <Card
                    key={profile.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg group",
                      isActive
                        ? "ring-2 ring-charcoal bg-charcoal/5"
                        : "hover:ring-1 hover:ring-gray-300"
                    )}
                    onClick={() => handleSelectPatient(profile)}
                  >
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold",
                              isActive
                                ? "bg-charcoal text-white"
                                : "bg-gray-100 text-gray-600"
                            )}
                          >
                            {profile.name?.[0]?.toUpperCase() || "P"}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-charcoal transition-colors">
                              {profile.name}
                            </h3>
                            {age !== null && (
                              <p className="text-sm text-gray-500">{age} anos</p>
                            )}
                          </div>
                        </div>
                        {isActive && (
                          <Badge className="bg-charcoal text-white">
                            Selecionado
                          </Badge>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        {profile.insuranceType && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>{profile.insuranceType}</span>
                          </div>
                        )}
                        {profile.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{profile.phone}</span>
                          </div>
                        )}
                        {profile.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{profile.email}</span>
                          </div>
                        )}
                        {registrationDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Paciente desde {registrationDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPatient(profile);
                          }}
                        >
                          <User className="h-4 w-4 mr-1" />
                          Selecionar
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartService(profile);
                          }}
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          Atender
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
