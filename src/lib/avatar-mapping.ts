export function getAvatarForProject(projectName: string): string {
  // Convert project name to lowercase and remove spaces for matching
  const normalizedName = projectName.toLowerCase().replace(/\s+/g, '');
  
  // Return the avatar path based on the project name
  return `/avatars/${normalizedName}.jpg`;
}