import { useRouter } from 'expo-router';
import { ChartColumn, Compass, LogOut, Settings, Shapes, Store, User } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useSesion } from '@/features/auth/hooks';
import { useTour } from '@/features/onboarding/hooks';
import { useRefrescar } from '@/shared/hooks';
import { Button, Modal, Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { OpcionMenu } from '../../components';
import { usePerfil } from '../../hooks';

/**
 * El tab "Mas": la puerta a todo lo que no es el trabajo del dia.
 *
 * Es un menu, no una pantalla de contenido: cada fila lleva a otro lado. Lo que
 * no entra en dashboard, facturas ni clientes vive aca abajo.
 */
export function MasMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { cerrarSesion } = useSesion();
  const { usuario, refrescar } = usePerfil();
  const refresco = useRefrescar(refrescar);
  const tour = useTour();
  const [confirmando, setConfirmando] = useState(false);

  const confirmarCierre = useCallback(() => {
    setConfirmando(false);
    cerrarSesion();
  }, [cerrarSesion]);

  const tamanoIcono = theme.typography.size.body;

  return (
    <Pantalla titulo="Mas" descripcion="Tu cuenta y los ajustes de la app.">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        {usuario ? (
          <View style={styles.tarjetaUsuario}>
            <Text variant="title" weight="bold">
              {usuario.nombre}
            </Text>
            <Text variant="caption" tone="muted">
              {usuario.email}
            </Text>
          </View>
        ) : null}

        {/*
          Las especies son trabajo del negocio, no un ajuste: van en su propio
          grupo, arriba de la cuenta y la configuracion.
        */}
        <View style={styles.grupo}>
          <OpcionMenu
            icono={<ChartColumn size={tamanoIcono} color={theme.colors.text} />}
            titulo="Métricas"
            descripcion="Los números del negocio: deuda, cobranza y ventas"
            onPress={() => router.push('/admin/cuenta/metricas')}
          />
          <OpcionMenu
            icono={<Store size={tamanoIcono} color={theme.colors.text} />}
            titulo="Mi marca"
            descripcion="Tu negocio, lo que mueve y sus dueños"
            onPress={() => router.push('/admin/cuenta/marca')}
          />
          <OpcionMenu
            icono={<Shapes size={tamanoIcono} color={theme.colors.text} />}
            titulo="Especies"
            descripcion="Los tipos de mercaderia que vendes"
            onPress={() => router.push('/admin/cuenta/especies')}
          />
        </View>

        <View style={styles.grupo}>
          <OpcionMenu
            icono={<User size={tamanoIcono} color={theme.colors.text} />}
            titulo="Mi perfil"
            descripcion="Tus datos y como iniciaste sesion"
            onPress={() => router.push('/admin/cuenta/perfil')}
          />
          <OpcionMenu
            icono={<Settings size={tamanoIcono} color={theme.colors.text} />}
            titulo="Configuracion"
            descripcion="Apariencia y tipografia"
            onPress={() => router.push('/admin/cuenta/configuracion')}
          />
          {/*
            Solo aparece cuando la guia NO se esta viendo: con la hoja abierta,
            "verla de nuevo" no significa nada y ensucia el menu.

            Y no es la misma accion en los dos casos: al que la bajo sin terminar
            se le devuelve donde iba, al que ya la termino se le empieza de cero.
          */}
          {tour.minimizado ? (
            <OpcionMenu
              icono={<Compass size={tamanoIcono} color={theme.colors.text} />}
              titulo="Retomar la guia"
              descripcion={`Seguis en el paso ${tour.numero} de ${tour.total}`}
              navega={false}
              onPress={tour.retomar}
            />
          ) : null}
          {tour.terminado ? (
            <OpcionMenu
              icono={<Compass size={tamanoIcono} color={theme.colors.text} />}
              titulo="Ver la guia de nuevo"
              descripcion="Vuelve a mostrar el recorrido desde el principio"
              navega={false}
              onPress={tour.reiniciar}
            />
          ) : null}
        </View>

        <View style={styles.grupo}>
          <OpcionMenu
            icono={<LogOut size={tamanoIcono} color={theme.colors.error} />}
            titulo="Cerrar sesion"
            tono="error"
            navega={false}
            onPress={() => setConfirmando(true)}
          />
        </View>
      </ScrollView>

      {/*
        Se confirma a proposito: el boton esta a un toque de distancia en un
        menu por el que se pasa seguido, y salir obliga a escribir la contrasena
        de nuevo.
      */}
      <Modal
        visible={confirmando}
        onClose={() => setConfirmando(false)}
        titulo="Cerrar sesion"
        descripcion="Vas a tener que volver a entrar con tu email y contrasena."
        acciones={
          <>
            <Button label="Cancelar" variant="ghost" onPress={() => setConfirmando(false)} />
            <Button label="Cerrar sesion" variant="danger" onPress={confirmarCierre} />
          </>
        }
      />
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.lg, paddingBottom: theme.spacing.lg },
    tarjetaUsuario: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    grupo: { gap: theme.spacing.sm },
  });
