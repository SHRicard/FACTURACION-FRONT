import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { Bug, LayoutDashboard, Menu, Store, Users } from 'lucide-react-native';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RutaProtegida } from '@/features/auth/components';
import type { Rol } from '@/features/auth/types';
import { BarraTabs, espacioDeBarra, type TabDefinido } from '@/shared/ui/atoms';
import { useEstiloTabs, useTheme, type Theme } from '@/theme';

/**
 * Quien puede entrar al panel. Solo el `super_admin`: un administrador que
 * llame a `/admin/*` recibe 403. Esta lista y `INICIO_POR_ROL` (en
 * `features/auth/rutas.ts`) se cambian juntos.
 */
const ROLES_PERMITIDOS: readonly Rol[] = ['super_admin'];

/**
 * Los tabs del panel, en el ORDEN en que se dibujan (docs/SUPER_ADMIN.md, 2).
 * "Mas" junta el estado del sistema, la configuracion y cerrar sesion.
 */
const TABS: readonly TabDefinido[] = [
  { ruta: 'index', etiqueta: 'Tablero', Icono: LayoutDashboard },
  { ruta: 'usuarios', etiqueta: 'Usuarios', Icono: Users },
  { ruta: 'marcas', etiqueta: 'Marcas', Icono: Store },
  { ruta: 'errores', etiqueta: 'Errores', Icono: Bug },
  { ruta: 'mas', etiqueta: 'Más', Icono: Menu },
];

/**
 * Panel del super_admin: el dueño de la app. No opera un negocio: mira la
 * plataforma entera y da soporte.
 *
 * Misma forma que el area de administrador: la barra la dibuja `BarraTabs` en
 * el estilo elegido en Configuracion, y cada pantalla dibuja su encabezado con
 * `Pantalla`.
 */
export default function SuperAdminLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { estilo } = useEstiloTabs();
  const styles = createStyles(theme);

  const dibujarBarra = useCallback(
    (props: BottomTabBarProps) => <BarraTabs {...props} tabs={TABS} />,
    [],
  );

  return (
    <RutaProtegida roles={ROLES_PERMITIDOS}>
      <View style={styles.raiz}>
        <Tabs
          tabBar={dibujarBarra}
          screenOptions={{
            headerShown: false,
            // Un tab es un lugar al que se va, no una pantalla que se recuerda:
            // al salir, su stack vuelve al principio (ver el layout de /admin).
            popToTopOnBlur: true,
            tabBarStyle: { height: espacioDeBarra(estilo, insets.bottom) },
          }}
        >
          {TABS.map((tab) => (
            <Tabs.Screen key={tab.ruta} name={tab.ruta} options={{ title: tab.etiqueta }} />
          ))}
        </Tabs>
      </View>
    </RutaProtegida>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    raiz: { flex: 1, backgroundColor: theme.colors.background },
  });
